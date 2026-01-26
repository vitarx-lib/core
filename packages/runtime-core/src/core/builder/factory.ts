import { IS_VIEW_BUILDER } from '../../constants/symbol.js'
import type { AnyProps, CodeLocation, View } from '../../types/index.js'

/**
 * 视图解析器
 */
export type ViewBuilder<P extends AnyProps = AnyProps, R extends View = View> = {
  (props: P | null, location?: CodeLocation): R
  [IS_VIEW_BUILDER]: true
}

/**
 * 标记一个函数为视图构建器
 *
 * 此函数用于标记一个特殊的视图节点构建器，
 * 当构建器在 jsx 中被当做组件使用时，它会在视图构建阶段被调用。
 *
 * 视图构建器允许接收以下参数：
 * - props: 视图节点属性
 * - key: 视图节点key
 * - location: 节点位置，仅开发时，通常用于打印警告信息。
 *
 * @example
 * ```jsx
 * // 标记一个视图构建器
 * const Button = builder((props,key,location) => {
 *    return createView('button', props, key, location)
 * })
 * // 使用
 * function App() {
 *  return <Button>按钮</Button>
 * }
 * ```
 *
 * @template T - 构建的节点type
 * @param builder - 视图构建函数
 * @returns {ViewBuilder<T>} - 返回视图构建函数
 */
export function builder<P extends AnyProps, R extends View>(
  builder: (props: P, location?: CodeLocation) => R
): ViewBuilder<P, R> {
  Object.defineProperty(builder, IS_VIEW_BUILDER, {
    value: true,
    configurable: false,
    enumerable: false
  })
  return builder as ViewBuilder<P, R>
}
