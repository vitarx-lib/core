import { Comment, Fragment, Text, VNODE_SYMBOL } from './node-symbol.js'
import type {
  CommentVNode,
  ContainerVNode,
  ElementVNode,
  FragmentVNode,
  TextVNode,
  VNode,
  WidgetVNode
} from './nodes'

/**
 * 检查给定的值是否为VNode节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是VNode节点则返回true，否则返回false
 */
export function isVNode(val: any): val is VNode {
  return val && typeof val === 'object' && val[VNODE_SYMBOL] === true
}

/**
 * 检查传入的值是否为WidgetVNode类型
 * 这是一个类型守卫函数，用于在运行时验证值的类型
 * @param val - 需要检查的值
 *
 * @returns {boolean} 如果值是WidgetVNode类型则返回true，否则返回false
 */
export function isWidgetVNode(val: any): val is WidgetVNode {
  if (!isVNode(val)) return false
  // 使用类型谓语(val is WidgetVNode)来确保类型收窄
  return typeof val.type === 'function'
}

/**
 * 检查给定的值是否为片段虚拟节点(FragmentVNode)
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isFragmentVNode(val: any): val is FragmentVNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查虚拟节点的类型是否为Fragment，若是则返回true
  return val.type === Fragment
}

/**
 * 检查给定的值是否为HTML元素节点(ElementVNode)
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isElementVNode(val: any): val is ElementVNode {
  // 首先检查是否是虚拟节点
  if (!isVNode(val)) return false
  // 然后检查节点的类型是否为字符串
  if (typeof val.type !== 'string') return false
  // 最后排除文本节点和注释节点
  return !(
    val.type === (Text as unknown as string) ||
    val.type === (Comment as unknown as string) ||
    val.type === (Fragment as unknown as string)
  )
}

/**
 * 检查给定的值是否为文本虚拟节点(TextVNode)
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是文本虚拟节点则返回true，否则返回false
 */
export function isTextVNode(val: any): val is TextVNode {
  // 首先检查值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查虚拟节点的类型是否为Text，如果是则返回true
  return val.type === Text
}

/**
 * 检查给定的值是否为注释虚拟节点(CommentVNode)
 *
 * @param val - 需要检查的任意类型值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isCommentVNode(val: any): val is CommentVNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查该虚拟节点的类型是否为Comment，如果是则返回true
  return val.type === Comment
}

/**
 * 判断给定的值是否是容器虚拟节点(ContainerVNode)
 * 容器虚拟节点是指可以包含子节点的虚拟节点，排除了文本节点和注释节点、组件节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是容器虚拟节点则返回true，否则返回false
 */
export function isContainerVNode(val: any): val is ContainerVNode {
  // 首先检查是否是虚拟节点
  if (!isVNode(val)) return false
  // 然后检查节点的类型是否为字符串
  if (typeof val.type !== 'string') return false
  // 最后排除文本节点和注释节点
  return !(val.type === (Text as unknown as string) || val.type === (Comment as unknown as string))
}

/**
 * 检查给定的值是否为无标签的虚拟节点(NoTagVNode)
 * 无标签的虚拟节点是指没有标签的虚拟节点，如文本节点和注释节点
 *
 * @param val - 需要检查的任意类型值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isNotTagVNode(val: any): val is CommentVNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查节点类型是否为文本节点或注释节点
  return val.type === Text || val.type === Comment
}
