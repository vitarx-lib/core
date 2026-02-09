import { type Ref, ShallowRef, shallowRef, watch } from '@vitarx/responsive'
import { isFunction, logger, type VoidCallback } from '@vitarx/utils'
import { defineValidate, getInstance, getRenderer } from '../../../runtime/index.js'
import type { ValidChild, View } from '../../../types/index.js'
import { resolveChild } from '../../../view/compiler/resolve.js'
import { CommentView, ListView } from '../../../view/index.js'
import { checkKey, ensureMounted, getLIS, moveDOM, normalizeKeyResolver } from './For.utils.js'

export type ListItemFactory<T> = (item: T, index: Ref<number>) => ValidChild
export type ListKeyResolver<T> = keyof T | ((item: T) => any)

export interface ListItemRecord {
  view: View
  indexRef: ShallowRef<number>
}

export type ListItemMap = Map<any, ListItemRecord>
interface DiffResult {
  newChildren: View[]
  sourceIndex: number[]
  newItemMap: ListItemMap
}
export interface ListLifecycleHook {
  onLeave?: (view: View, done: VoidCallback) => void
  onEnter?: (view: View) => void
  onBeforeUpdate?: (children: View[]) => void
  onAfterUpdate?: (children: View[]) => void
}

export interface ListProps<T> {
  each: readonly T[]
  children: ListItemFactory<T>
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
