import { logger, popProperty } from '@vitarx/utils'
import { pruneCache } from '../../components/Freeze/src/Freeze.utils.js'
import { isComponent } from '../../shared/index.js'
import type { AnyProps, Component, ValidChildren, View, ViewTag } from '../../types/index.js'
import { createView } from '../compiler/factory.js'
import { DynamicViewSource } from '../compiler/source.js'
import { CommentView } from '../implements/atomic.js'
import { DynamicView } from '../implements/dynamic.js'
import { builder, type ViewBuilder } from './factory.js'

export interface DynamicProps {
  /**
   * 动态渲染的目标
   *
   * 支持以下类型：
   * - **组件函数**：`() => View` 或 `Component` 函数
   * - **元素标签**：如 `'div'`、`'span'`、`'button'` 等
   * - **响应式引用**：`Ref<Component>` 或 `Ref<string>`
   *
   * @example
   * ```tsx
   * // 渲染组件
   * <Dynamic is={MyComponent} />
   *
   * // 渲染元素标签
   * <Dynamic is="div">Content</Dynamic>
   *
   * // 响应式切换
   * const current = ref(ComponentA)
   * <Dynamic is={current.value} />
   * ```
   */
  is: ViewTag
  /**
   * 组件视图缓存策略
   *
   * - `false`（默认）：不缓存
   * - `true`：缓存所有组件视图，不限制数量
   * - `number > 0`：缓存指定数量的组件视图，采用 LRU 策略
   * - `number <= 0`：等同于 `true`，不限制数量
   *
   * **注意**：
   * - 仅对组件函数有效，元素标签不会被缓存
   * - 缓存基于组件函数的引用，相同函数会复用同一视图
   * - 如需完整的组件缓存功能（include/exclude），请使用 `Freeze` 组件
   *
   * @default false
   *
   * @example
   * ```tsx
   * // 缓存所有组件视图
   * <Dynamic is={current.value} memo />
   *
   * // 最多缓存 3 个组件视图（LRU 策略）
   * <Dynamic is={current.value} memo={3} />
   * ```
   */
  memo?: boolean | number
  /**
   * 子元素插槽内容
   *
   * 会原样传递给渲染的元素/组件
   */
  children?: ValidChildren
  /**
   * 其他自定义属性
   *
   * 会原样传递给渲染的元素/组件
   */
  [key: string]: any
}

/**
 * 动态视图构建器
 *
 * 根据传入的 `is` 属性动态渲染组件或元素。
 * 支持响应式切换，当 `is` 值变化时自动更新渲染内容。
 *
 * @example
 * ```tsx
 * // 基础用法：动态组件
 * const App = () => {
 *   const current = shallowRef(ComponentA)
 *   return <Dynamic is={current.value} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 动态元素标签
 * const App = () => {
 *   const tag = ref<'div' | 'span'>('div')
 *   return <Dynamic is={tag.value}>Content</Dynamic>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 传递属性
 * <Dynamic is={MyComponent} title="Hello" data-id={123} />
 * ```
 *
 * @param props - 属性对象
 * @param props.is - 动态渲染的目标（组件/元素标签）
 * @param [props.memo=false] - 是否缓存组件视图实例
 * @param [props.children] - 子元素插槽
 * @returns {View} 动态/静态视图对象（取决于传入的is是否具有响应性）
 */
export const Dynamic = builder((props: DynamicProps, location): View => {
  const resolvedProps: AnyProps = {}
  const memo = popProperty(props, 'memo') ?? false
  const maxCache = typeof memo === 'number' && memo > 0 ? memo : 0
  const useCache = memo !== false
  const cache: Map<Component, View> | null = useCache ? new Map() : null

  for (const key in props) {
    if (key === 'is') continue
    Object.defineProperty(resolvedProps, key, {
      get() {
        return props[key]
      },
      enumerable: true,
      configurable: true
    })
  }

  const viewSource = new DynamicViewSource(() => {
    const is = props['is']
    if (!is) {
      const message = `Dynamic "is" prop is mandatory and cannot be empty.`
      logger.warn(message, location)
      return new CommentView(message)
    }
    if (cache && isComponent(is)) {
      const cached = cache.get(is)
      if (cached) return cached
      const view = createView(is, resolvedProps, location)
      cache.set(is, view)
      pruneCache(cache, maxCache)
      return view
    }
    return createView(is, resolvedProps, location)
  })

  return viewSource.isStatic ? viewSource.value : new DynamicView(viewSource, location)
})

export type Dynamic = ViewBuilder<DynamicProps> & { __is_dynamic: true }
