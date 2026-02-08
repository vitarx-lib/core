import { isFunction, logger, type VoidCallback } from '@vitarx/utils'
import {
  defineValidate,
  getInstance,
  getRenderer,
  onDispose,
  onHide,
  onShow,
  viewEffect
} from '../../../runtime/index.js'
import type { ValidChild, View } from '../../../types/index.js'
import { resolveChild } from '../../../view/compiler/resolve.js'
import { CommentView, ListView } from '../../../view/index.js'
import { ensureMounted, getLIS, moveDOM, removeView } from './For.utils.js'

type ListItemFactory<T> = (item: T, index: number) => ValidChild
type ListKeyResolver<T> = (item: T, index: number) => any

interface ListItemRecord {
  view: View
  index: number
}

type ListItemMap = Map<any, ListItemRecord>

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
 *       key={(item, index) => item}
 *       children={(item, index) => <div>{item}</div>}
 *     />
 *   );
 * }
 * ```
 */
export function For<T>(props: ForProps<T>): ListView {
  const instance = getInstance()!
  const location = instance.view.location
  const build = (item: T, i: number): View => {
    try {
      const child = props.children(item, i)
      return resolveChild(child) || new CommentView(`for:<${i}>_invalid`)
    } catch (e) {
      instance.reportError(e, 'view:build')
      return new CommentView(`for:<${i}>_build_failed}`)
    }
  }
  const keyExtractor = props.key ?? ((item: T) => item)
  const onLeaveCb = props.onLeave
  const onEnterCb = props.onEnter
  const onBeforeUpdateCb = props.onBeforeUpdate
  const onAfterUpdateCb = props.onAfterUpdate

  let keyedMap: ListItemMap = new Map()
  const listView = new ListView()
  const checkKey = (key: unknown, index: number, map: ListItemMap): unknown => {
    if (map.has(key)) {
      logger.warn(`Duplicate key "${String(key)}"`, location)
      return { __dup: key, index: index }
    }
    return key
  }
  /* ---------- mount ---------- */
  let runner = (): void => {
    const each = props.each
    for (let i = 0; i < each.length; i++) {
      const item = each[i]
      const key = checkKey(keyExtractor(item, i), i, keyedMap)
      const view = build(item, i)
      keyedMap.set(key, { view, index: i })
      listView.append(view)
    }
  }
  const effect = viewEffect(() => {
    runner()
  })
  if (effect) {
    /* ---------- update ---------- */
    runner = (): void => {
      if (listView.isMounted) onBeforeUpdateCb?.(Array.from(listView.children))
      const each = props.each
      const length = each.length
      const renderer = getRenderer()

      const newMap: ListItemMap = new Map()
      const newChildren = new Array<View>(length)
      const sourceIndex = new Array<number>(length).fill(-1)

      // build new children
      for (let i = 0; i < length; i++) {
        const item = each[i]
        const key = checkKey(keyExtractor(item, i), i, newMap)
        const cached = keyedMap.get(key)
        let view: View
        if (cached) {
          view = cached.view
          sourceIndex[i] = cached.index
        } else {
          view = build(item, i)
        }
        newMap.set(key, { view, index: i })
        newChildren[i] = view
      }

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
      for (const [key, { view }] of keyedMap) {
        if (!newMap.has(key)) {
          removeView(listView, view, onLeaveCb)
        }
      }

      keyedMap = newMap
      if (listView.isMounted) onAfterUpdateCb?.(Array.from(listView.children))
    }
    onDispose(effect.dispose)
    onHide(effect.pause)
    onShow(effect.resume)
  }
  return listView
}

defineValidate(For, (props): void => {
  if (!Array.isArray(props.each)) {
    throw new TypeError(`[For]: each expects an array, received ${typeof props.each}`)
  }
  if (!isFunction(props.children)) {
    throw new TypeError(`[For]: children expects a function, received ${typeof props.children}`)
  }
  if (props.key && !isFunction(props.key)) {
    throw new TypeError(`[For]: key expects a function, received ${typeof props.key}`)
  }
  if (props.onLeave && !isFunction(props.key)) {
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
