import { type Ref, ShallowRef, shallowRef, untrack } from '@vitarx/responsive'
import { isFunction, logger, type VoidCallback } from '@vitarx/utils'
import { defineValidate, getInstance, getRenderer, viewEffect } from '../../../runtime/index.js'
import type { ValidChild, View } from '../../../types/index.js'
import { resolveChild } from '../../../view/compiler/resolve.js'
import { CommentView, ListView } from '../../../view/index.js'
import { checkKey, ensureMounted, getLIS, normalizeKeyResolver } from './For.utils.js'

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
export type ListItemMap = Map<unknown, ListItemRecord>

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
  onBeforeUpdate?: (children: IterableIterator<View>) => void

  /**
   * 列表更新后触发的回调函数
   *
   * 在列表数据发生变化且DOM更新完成后调用。
   * 可以用于执行更新后的操作，如重新计算布局等。
   *
   * @param children - 更新后的所有子视图实例数组
   */
  onAfterUpdate?: (children: IterableIterator<View>) => void
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

  const keyOf = normalizeKeyResolver(props.key, location, componentName)

  const listView = new ListView()
  const pendingRemoved: ListItemMap = new Map()
  let itemMap: ListItemMap = new Map()

  /** 构建单个 View */
  const buildView = (item: T, indexRef: ShallowRef<number>): View => {
    try {
      const child = props.children(item, indexRef)
      return resolveChild(child) || new CommentView(`for:<${indexRef.value}>_invalid`)
    } catch (e) {
      instance.reportError(e, 'view:build')
      return new CommentView(`for:<${indexRef.value}>_error`)
    }
  }

  /** 删除单条记录 */
  const removeRecord = (key: unknown, record: ListItemRecord) => {
    const view = record.view
    listView.remove(view)

    if (!props.onLeave) {
      view.dispose()
      return
    }

    pendingRemoved.set(key, record)

    let doneCalled = false
    const done = () => {
      if (doneCalled) return
      doneCalled = true
      if (pendingRemoved.get(key)?.view === view) {
        pendingRemoved.delete(key)
        view.dispose()
      }
    }

    try {
      props.onLeave(view, done)
    } catch (e) {
      logger.warn(`[${componentName}] onLeave callback error: ${e}`, location)
      done()
    }
  }

  /**
   * 预计算新列表的所有 key 值，并进行重复检测
   *
   * 确保同一更新周期内 key 值一致，避免多次调用 keyOf 产生不同结果。
   * 同时在更新阶段也执行重复 key 检测（之前只在初次挂载时检测）。
   *
   * @param list - 新列表数据
   * @param len - 列表长度
   * @returns 预计算的 key 数组，索引与列表索引一一对应
   */
  const computeNewKeys = (list: readonly T[], len: number): unknown[] => {
    const keys: unknown[] = new Array(len)
    const usedKeys = new Map<unknown, number>()
    for (let i = 0; i < len; i++) {
      keys[i] = checkKey(keyOf(list[i], i), i, usedKeys, componentName, location)
    }
    return keys
  }

  /** 核心副作用 */
  const effect = viewEffect(() => {
    // ===== 1️⃣ 依赖收集阶段 =====
    const list = props.each
    const len = list.length
    for (let i = 0; i < len; i++) {
      void list[i]
    }

    // ===== 2️⃣ 非依赖执行阶段 =====
    untrack(() => {
      props.onBeforeUpdate && props.onBeforeUpdate(listView.children)

      // 全量卸载
      if (!len) {
        for (const [key, record] of itemMap) {
          removeRecord(key, record)
        }
        itemMap.clear()
        return
      }

      // 预计算所有 key，确保同一更新周期内 key 值一致
      const newKeys = computeNewKeys(list, len)

      // 全量/初次挂载
      if (!itemMap.size) {
        for (let i = 0; i < len; i++) {
          const key = newKeys[i]
          const indexRef = shallowRef(i)
          const view = buildView(list[i], indexRef)
          itemMap.set(key, { view, indexRef })
          listView.append(view)
          ensureMounted(view, listView, null, props.onEnter)
        }
        return
      }

      // 部分更新：双端 diff + 中段 LIS
      const oldRecords = Array.from(itemMap.entries())
      const oldLen = oldRecords.length

      let oldStart = 0
      let oldEnd = oldLen - 1
      let newStart = 0
      let newEnd = len - 1

      const newMap: ListItemMap = new Map()

      // 头部对比
      while (oldStart <= oldEnd && newStart <= newEnd) {
        const [oldKey, oldRec] = oldRecords[oldStart]
        if (oldKey !== newKeys[newStart]) break
        oldRec.indexRef.value = newStart
        newMap.set(oldKey, oldRec)
        oldStart++
        newStart++
      }

      // 尾部对比
      while (oldStart <= oldEnd && newStart <= newEnd) {
        const [oldKey, oldRec] = oldRecords[oldEnd]
        if (oldKey !== newKeys[newEnd]) break
        oldRec.indexRef.value = newEnd
        newMap.set(oldKey, oldRec)
        oldEnd--
        newEnd--
      }

      // 中段处理
      const middleNewCount = newEnd - newStart + 1

      if (middleNewCount > 0) {
        // ===== 第一步：构建旧节点 key -> index 映射表 =====
        const keyToOldIndex = new Map<any, number>()
        for (let i = oldStart; i <= oldEnd; i++) {
          keyToOldIndex.set(oldRecords[i][0], i)
        }

        // ===== 第二步：遍历新列表中段，建立新旧节点对应关系 =====
        const sourceIndex = new Array(middleNewCount).fill(-1)

        for (let i = 0; i < middleNewCount; i++) {
          const newIndex = newStart + i
          const key = newKeys[newIndex]

          const oldIndex = keyToOldIndex.get(key)
          if (oldIndex != null) {
            const record = oldRecords[oldIndex][1]
            record.indexRef.value = newIndex
            newMap.set(key, record)
            sourceIndex[i] = oldIndex
            keyToOldIndex.delete(key)
          } else {
            const reused = pendingRemoved.get(key)
            if (reused) {
              pendingRemoved.delete(key)
              reused.indexRef.value = newIndex
              newMap.set(key, { view: reused.view, indexRef: reused.indexRef })
            } else {
              const indexRef = shallowRef(newIndex)
              const view = buildView(list[newIndex], indexRef)
              newMap.set(key, { view, indexRef })
            }
          }
        }

        // 删除未匹配的旧节点
        for (const [key, oldIndex] of keyToOldIndex) {
          removeRecord(key, oldRecords[oldIndex][1])
        }

        // LIS 优化移动
        const lis = getLIS(sourceIndex)
        let lisIdx = lis.length - 1
        const renderer = getRenderer()
        let anchor: View | null = null
        if (newEnd + 1 < len) {
          anchor = newMap.get(newKeys[newEnd + 1])?.view ?? null
        }

        for (let i = middleNewCount - 1; i >= 0; i--) {
          const newIndex = newStart + i
          const key = newKeys[newIndex]
          const record = newMap.get(key)!
          const view = record.view

          if (sourceIndex[i] === -1) {
            listView.insert(view, anchor)
            ensureMounted(view, listView, anchor, props.onEnter)
          } else if (lisIdx >= 0 && lis[lisIdx] === i) {
            lisIdx--
          } else {
            listView.move(view, anchor)
            if (view.isMounted) {
              if (anchor) renderer.insert(view.node, anchor.node)
              else renderer.append(view.node, listView.node)
            }
          }
          anchor = view
        }
      } else if (oldStart <= oldEnd) {
        for (let i = oldStart; i <= oldEnd; i++) {
          const [key, record] = oldRecords[i]
          removeRecord(key, record)
        }
      }

      // 更新 itemMap
      itemMap = newMap

      props.onAfterUpdate && props.onAfterUpdate(listView.children)
    })
  })

  if (effect) instance.scope.add(effect)

  return listView
}

defineValidate(For, (props, location): void => {
  if (!Array.isArray(props.each)) {
    throw new TypeError(`[For] each expects an array, received ${typeof props.each}`)
  }
  if (!isFunction(props.children)) {
    throw new TypeError(`[For] children expects a function, received ${typeof props.children}`)
  }
  if (props.key !== undefined) {
    if (typeof props.key !== 'function' && typeof props.key !== 'string') {
      throw new TypeError(`[For] key expects a function or string, received ${typeof props.key}`)
    }
  } else {
    logger.warn(
      '[For] key prop is not provided, consider adding a unique key for each item to optimize rendering',
      location
    )
  }
  if (props.onLeave && !isFunction(props.onLeave)) {
    throw new TypeError(`[For] onLeave expects a function, received ${typeof props.onLeave}`)
  }
  if (props.onEnter && !isFunction(props.onEnter)) {
    throw new TypeError(`[For] onEnter expects a function, received ${typeof props.onEnter}`)
  }
  if (props.onAfterUpdate && !isFunction(props.onAfterUpdate)) {
    throw new TypeError(
      `[For] onAfterUpdate expects a function, received ${typeof props.onAfterUpdate}`
    )
  }
  if (props.onBeforeUpdate && !isFunction(props.onBeforeUpdate)) {
    throw new TypeError(
      `[For] onBeforeUpdate expects a function, received ${typeof props.onBeforeUpdate}`
    )
  }
})
