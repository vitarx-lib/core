import { IS_VNODE_BUILDER } from '../../constants/index.js'
import type { AnyProps, VNode, VNodeBuilder } from '../../types/index.js'

/**
 * 定义/标记一个节点构建器
 *
 * 此函数用于标记一个特殊的虚拟节点构建器，
 * 当构建器被当做组件使用时，会自动调用它来构建新的节点。
 *
 * 它和无状态组件具有一定区别，无状态组件会构建成无状态组件节点，由无状态组件控制器进行渲染以及更新管理。
 * 而节点构建器它本身不会成为一个节点，而是构建节点，它没有单独的控制器，纯构建节点逻辑。
 *
 * @example
 * ```js
 * export const ButtonBuilder = defineNodeBuilder(props => {
 *    // 视图每次更新都会重新运行此函数
 *    return createVNode('button', props)
 * })
 * ```
 *
 * @template T - 构建的节点type
 * @param builder - 节点构建函数
 * @returns {VNodeBuilder<T>} - 返回节点构建函数
 */
export function defineNodeBuilder<P extends AnyProps, R extends VNode>(
  builder: (props: P) => R
): VNodeBuilder<P, R> {
  Object.defineProperty(builder, IS_VNODE_BUILDER, {
    value: true
  })
  return builder as VNodeBuilder<P, R>
}

/**
 * 检查一个值是否为节点构建器
 *
 * @param val - 需要检查的值
 * @returns {boolean} - 如果是节点构建器则返回true，否则返回false
 */
export function isNodeBuilder(val: any): val is VNodeBuilder {
  return typeof val === 'function' && val?.[IS_VNODE_BUILDER]
}
