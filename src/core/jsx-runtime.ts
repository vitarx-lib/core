import {
  type Children,
  createElement,
  type VNode,
  type VNodeProps,
  type VNodeType
} from './view/index.js'

/**
 * 创建元素`VNode`
 *
 * 该方法是`createElement`的别名。
 *
 * @see createElement
 */
export function jsx<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Children
): VNode<T> {
  return createElement(type, props, ...children)
}
