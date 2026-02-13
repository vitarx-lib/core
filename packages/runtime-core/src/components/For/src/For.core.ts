import { type Ref, ShallowRef, shallowRef, watch } from '@vitarx/responsive'
import { isFunction, logger, type VoidCallback } from '@vitarx/utils'
import { defineValidate, getInstance, getRenderer } from '../../../runtime/index.js'
import type { ValidChild, View } from '../../../types/index.js'
import { resolveChild } from '../../../view/compiler/resolve.js'
import { CommentView, ListView } from '../../../view/implements/index.js'
import { checkKey, ensureMounted, getLIS, moveDOM, normalizeKeyResolver } from './For.utils.js'

/**
 * 列表项渲染工厂函数类型
 *
 * 定义了如何将列表数据项转换为可渲染的子元素。
 *
 * @template T - 列表项的数据类型
 * @param item - 当前列表项的数据
 * @param index - 当前项的索引引用（响应式）
 * @returns - 返回有效的子元素（View实例、字符串、数字等）
 *
 * @example
 * ```jsx
 * // 简单文本渲染
 * const renderTextItem: ListItemFactory<string> = (item, index) => {
 *   return `${item} (${index.value})`
 * }
 *
 * // 复杂组件渲染
 * const renderUserItem: ListItemFactory<User> = (user, index) => {
 *   return createView(UserCard, {
 *     user,
 *     index: index.value
 *   })
 * }
 * ```
 */
export type ListItemFactory<T> = (item: T, index: Ref<number>) => ValidChild
/**
 * 列表项键值解析器类型
 *
 * 定义了如何为列表项生成唯一标识，用于优化渲染性能和状态保持。
 *
 * @template T - 列表项的数据类型
 *
 * @example
 * ```jsx
 * // 使用函数形式 - 推荐
 * const keyResolver: ListKeyResolver<User> = (user) => user.id
 *
 * // 使用属性名形式
 * const keyResolver: ListKeyResolver<User> = 'id'
 *
 * // 在组件中使用
 * <For
 *   each={users}
 *   key={user => user.id}  // 或 key="id"
 *   children={(user) => <div>{user.name}</div>}
 * />
 * ```
 */
export type ListKeyResolver<T> = keyof T | ((item: T) => any)

/**
 * 列表项记录接口
 *
 * 内部用于跟踪列表中每个项的视图实例和索引信息。
 *
 * @internal
 */
export interface ListItemRecord {
  /** 对应的视图实例 */
  view: View
  /** 索引的响应式引用 */
  indexRef: ShallowRef<number>
}

/**
 * 列表项映射表类型
 *
 * 用于存储列表项的键值到记录的映射关系，
 * 支持快速查找和状态管理。
 *
 * @internal
 */
export type ListItemMap = Map<any, ListItemRecord>
/**
 * 列表差异更新结果接口
 *
 * 用于存储列表diff算法的计算结果，
 * 包含新的子元素、源索引映射和新的项映射表。
 *
 * @internal
 */
interface DiffResult {
  /** 新的子视图数组 */
  newChildren: View[]
  /** 源索引映射数组，用于LIS算法 */
  sourceIndex: number[]
  /** 新的列表项映射表 */
  newItemMap: ListItemMap
}
/**
 * 列表组件生命周期钩子接口
 *
 * 定义了列表项在不同生命周期阶段可以执行的回调函数，
 * 用于实现列表项的进入、离开和更新动画效果。
 *
 * @example
 * ```jsx
 * <For
 *   each={items}
 *   key={item => item.id}
 *   onEnter={(view) => {
 *     // 列表项进入时的动画
 *     view.node.style.opacity = '0'
 *     setTimeout(() => {
 *       view.node.style.transition = 'opacity 0.3s'
 *       view.node.style.opacity = '1'
 *     }, 0)
 *   }}
 *   onLeave={(view, done) => {
 *     // 列表项离开时的动画
 *     view.node.style.transition = 'opacity 0.3s'
 *     view.node.style.opacity = '0'
 *     setTimeout(done, 300)
 *   }}
 *   children={(item) => <div>{item.name}</div>}
 * />
 * ```
 */
export interface ListLifecycleHook {
  /**
   * 列表项即将被移除时触发的回调函数
   *
   * 当列表项需要从DOM中移除时调用，可以用于实现离开动画。
   * 必须调用done回调来完成移除操作。
   *
   * @param view - 即将被移除的视图实例
   * @param done - 完成回调函数，调用后才会真正移除DOM元素
   */
  onLeave?: (view: View, done: VoidCallback) => void

  /**
   * 列表项被添加到DOM后触发的回调函数
   *
   * 当新的列表项被插入到DOM中后调用，可以用于实现进入动画。
   *
   * @param view - 新添加的视图实例
   */
  onEnter?: (view: View) => void

  /**
   * 列表更新前触发的回调函数
   *
   * 在列表数据发生变化，但在DOM更新之前调用。
   * 可以用于执行更新前的准备工作或获取当前状态。
   *
   * @param children - 当前的所有子视图实例数组
   */
  onBeforeUpdate?: (children: View[]) => void

  /**
   * 列表更新后触发的回调函数
   *
   * 在列表数据发生变化且DOM更新完成后调用。
   * 可以用于执行更新后的操作，如重新计算布局等。
   *
   * @param children - 更新后的所有子视图实例数组
   */
  onAfterUpdate?: (children: View[]) => void
}

/**
 * 列表组件基础属性接口
 *
 * 定义了For组件所需的核心属性，用于渲染动态列表。
 *
 * @template T - 列表项的数据类型
 *
 * @example
 * ```jsx
 * // 基本用法
 * <For
 *   each={[1, 2, 3]}
 *   key={item => item}
 *   children={(item, index) => <div>Item {item} at index {index}</div>}
 * />
 *
 * // 对象数组用法
 * <For
 *   each={users}
 *   key={user => user.id}
 *   children={(user) => <UserCard user={user} />}
 * />
 * ```
 */
export interface ListProps<T> {
  /**
   * 要渲染的列表数据数组
   *
   * 支持只读数组，当数组内容发生变化时，
   * 组件会自动更新对应的DOM元素。
   */
  each: readonly T[]

  /**
   * 列表项渲染函数
   *
   * 用于定义每个列表项如何渲染，接收当前项和索引作为参数，
   * 返回有效的子元素（View、字符串、数字等）。
   */
  children: ListItemFactory<T>

  /**
   * 列表项的唯一标识生成器
   *
   * 用于优化列表渲染性能和保持组件状态。
   * 可以是：
   * - 函数：接收(item)参数，返回唯一标识
   * - 字符串：作为对象属性名直接访问
   *
   * 虽然非必需，但强烈建议提供以获得更好的性能和状态保持。
   */
  key?: ListKeyResolver<T>
}

export interface ForProps<T> extends ListProps<T>, ListLifecycleHook {}
/**
 * For组件函数，用于渲染动态列表视图
 *
 * @template T - 列表项的数据类型
 * @param {ForProps<T>} props - 组件的属性对象
 * @returns {ListView} 返回列表视图实例
 *
 * @example
 * ```ts
 * // 基本用法
 * const items = ["apple", "banana", "cherry"];
 *
 * function App() {
 *   return (
 *     <For
 *       each={items}
 *       key={item => item}
 *       children={(item, index) => <div>{item}</div>}
 *     />
 *   );
 * }
 * ```
 */
export function For<T>(props: ForProps<T>): ListView {
  const instance = getInstance()!
  const location = instance.view.location
  const componentName = instance.view.name
  const buildView = (item: T, i: Ref<number>): View => {
    try {
      const child = props.children(item, i)
      return resolveChild(child) || new CommentView(`for:<${i.value}>_invalid`)
    } catch (e) {
      instance.reportError(e, 'view:build')
      return new CommentView(`for:<${i.value}>_build_failed}`)
    }
  }
  const keyOf = normalizeKeyResolver(props.key, location, componentName)

  const onLeaveCb = props.onLeave
  const onEnterCb = props.onEnter
  const onBeforeUpdateCb = props.onBeforeUpdate
  const onAfterUpdateCb = props.onAfterUpdate

  const listView = new ListView()
  let itemMap: ListItemMap = new Map()
  const pendingRemoved: ListItemMap = new Map()
  let render: () => void | DiffResult
  // 初始化
  render = (): void => {
    const each = props.each
    for (let i = 0; i < each.length; i++) {
      const item = each[i]
      const rawKey = keyOf(item, i)
      const key = checkKey(rawKey, i, itemMap, componentName)

      const indexRef = shallowRef(i)
      const view = buildView(item, indexRef)

      itemMap.set(key, { view, indexRef })
      listView.append(view)
    }
    render = diff
  }
  // diff 更新
  const diff = (): DiffResult => {
    const each = props.each
    const length = each.length
    const newItemMap: ListItemMap = new Map()
    const newChildren = new Array<View>(length)
    const sourceIndex = new Array<number>(length).fill(-1)
    // build new children
    for (let i = 0; i < length; i++) {
      const item = each[i]
      const rawKey = keyOf(item, i)
      const key = checkKey(rawKey, i, newItemMap, componentName)

      let view: View
      let indexRef: ShallowRef<number>

      // find existing view
      const cached = itemMap.get(key)
      if (cached) {
        view = cached.view
        indexRef = cached.indexRef
        const oldIndex = indexRef.raw
        indexRef.value = i
        sourceIndex[i] = oldIndex
      } else {
        // try revive pending removed
        const reused = pendingRemoved.get(key)
        if (reused) {
          pendingRemoved.delete(key)
          view = reused.view
          indexRef = reused.indexRef
          indexRef.value = i
        } else {
          // create new view
          indexRef = shallowRef(i)
          view = buildView(item, indexRef)
        }
      }
      newItemMap.set(key, { view, indexRef })
      newChildren[i] = view
    }
    return { newChildren, sourceIndex, newItemMap }
  }
  // 启动观察器
  watch(
    () => render(),
    diffResult => {
      if (!diffResult) return
      // 前置钩子
      onBeforeUpdateCb?.(Array.from(listView.children))
      const renderer = getRenderer()
      const { newChildren, sourceIndex, newItemMap } = diffResult
      const length = newChildren.length
      // LIS
      const lis = getLIS(sourceIndex)
      let lisCursor = lis.length - 1

      // apply move/insert
      let anchor: View | null = null
      for (let i = length - 1; i >= 0; i--) {
        const view = newChildren[i]
        const oldIndex = sourceIndex[i]

        if (oldIndex !== -1 && lisCursor >= 0 && lis[lisCursor] === i) {
          lisCursor--
          anchor = view
          continue
        }

        if (oldIndex === -1) {
          listView.insert(view, anchor)
          ensureMounted(view, listView, anchor, onEnterCb)
        } else {
          listView.move(view, anchor)
          moveDOM(renderer, listView, view, anchor)
        }

        anchor = view
      }

      // remove stale
      for (const [key, record] of itemMap) {
        if (newItemMap.has(key)) continue
        const view = record.view
        listView.remove(view)
        if (!onLeaveCb) {
          // 直接销毁视图
          view.dispose()
          continue
        }
        pendingRemoved.set(key, record)

        let isDone = false
        const done = () => {
          if (isDone) return
          isDone = true
          if (pendingRemoved.get(key)?.view === view) {
            pendingRemoved.delete(key)
            view.dispose()
          }
        }

        try {
          onLeaveCb(view, done)
        } catch (e) {
          logger.warn(`[${componentName}] onLeave callback throw error: ${e}`, location)
          done()
        }
      }

      // update map
      itemMap = newItemMap
      // 后置钩子
      onAfterUpdateCb?.(Array.from(listView.children))
    },
    { flush: 'main', immediate: true }
  )
  return listView
}

defineValidate(For, (props): void => {
  if (!Array.isArray(props.each)) {
    throw new TypeError(`[For]: each expects an array, received ${typeof props.each}`)
  }
  if (!isFunction(props.children)) {
    throw new TypeError(`[For]: children expects a function, received ${typeof props.children}`)
  }
  if (props.key !== undefined) {
    // 验证 key 类型：必须是函数或字符串（对象属性名）
    if (typeof props.key !== 'function' && typeof props.key !== 'string') {
      throw new TypeError(
        `[For]: key expects a function or string (property name), received ${typeof props.key}`
      )
    }
  } else {
    logger.warn(
      `[For]: key prop is not provided. ` +
        `While not mandatory, providing a key helps optimize list rendering performance ` +
        `and ensures proper component state preservation during list updates. ` +
        `Consider adding a unique key for each item.`,
      location
    )
  }
  if (props.onLeave && !isFunction(props.onLeave)) {
    throw new TypeError(`[For]: onLeave expects a function, received ${typeof props.onLeave}`)
  }
  if (props.onEnter && !isFunction(props.onEnter)) {
    throw new TypeError(`[For]: onEnter expects a function, received ${typeof props.onEnter}`)
  }
  if (props.onAfterUpdate && !isFunction(props.onAfterUpdate)) {
    throw new TypeError(
      `[For]: onAfterUpdate expects a function, received ${typeof props.onAfterUpdate}`
    )
  }
  if (props.onBeforeUpdate && !isFunction(props.onBeforeUpdate)) {
    throw new TypeError(
      `[For]: onBeforeUpdate expects a function, received ${typeof props.onBeforeUpdate}`
    )
  }
})
