import { ContainerNode, VNode } from '../base/index.js'
import { BaseElementNode, CommentNode, FragmentNode, TextNode, WidgetNode } from '../nodes/index.js'
import {
  COMMENT_NODE_TYPE,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE,
  VIRTUAL_NODE_SYMBOL
} from '../runtime/index.js'

/**
 * 检查给定的值是否为虚拟节点(VNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是VNode节点则返回true，否则返回false
 */
export function isVNode(val: any): val is VNode {
  return !!(val && typeof val === 'object' && val[VIRTUAL_NODE_SYMBOL] === true)
}

/**
 * 检查传入的值是否为WidgetNode类型
 * 这是一个类型守卫函数，用于在运行时验证值的类型
 * @param val - 需要检查的值
 *
 * @returns {boolean} 如果值是WidgetNode类型则返回true，否则返回false
 */
export function isWidgetNode(val: any): val is WidgetNode {
  if (!isVNode(val)) return false
  // 使用类型谓语(val is WidgetVNode)来确保类型收窄
  return typeof val.type === 'function'
}

/**
 * 检查给定的值是否为片段虚拟节点(FragmentNode)
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isFragmentNode(val: any): val is FragmentNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查虚拟节点的类型是否为Fragment，若是则返回true
  return val.type === FRAGMENT_NODE_TYPE
}

/**
 * 检查给定的值是否为HTML元素节点(ElementNode)
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isElementNode(val: any): val is BaseElementNode {
  // 首先检查是否是虚拟节点
  if (!isVNode(val)) return false
  // 然后检查节点的类型是否为字符串
  if (typeof val.type !== 'string') return false
  // 最后排除文本节点和注释节点
  return !(
    val.type === TEXT_NODE_TYPE ||
    val.type === COMMENT_NODE_TYPE ||
    val.type === FRAGMENT_NODE_TYPE
  )
}

/**
 * 检查给定的值是否为文本虚拟节点(TextNode)
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是文本虚拟节点则返回true，否则返回false
 */
export function isTextNode(val: any): val is TextNode {
  // 首先检查值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查虚拟节点的类型是否为Text，如果是则返回true
  return val.type === TEXT_NODE_TYPE
}

/**
 * 检查给定的值是否为注释虚拟节点(CommentVNode)
 *
 * @param val - 需要检查的任意类型值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isCommentNode(val: any): val is CommentNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查该虚拟节点的类型是否为Comment，如果是则返回true
  return val.type === COMMENT_NODE_TYPE
}

/**
 * 判断给定的值是否是父虚拟节点(FragmentNode|ElementNode)
 *
 * 父虚拟节点是指可以包含子节点的虚拟节点，仅片段节点或元素节点支持子节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是容器虚拟节点则返回true，否则返回false
 */
export function isContainerNode(val: any): val is ContainerNode {
  // 首先检查是否是虚拟节点
  if (!isVNode(val)) return false
  // 然后检查节点的类型是否为字符串
  if (typeof val.type !== 'string') return false
  // 最后排除文本节点和注释节点
  return !(val.type === TEXT_NODE_TYPE || val.type === COMMENT_NODE_TYPE)
}

/**
 * 检查给定的值是否为非元素节点(TextNode|CommentNode)
 *
 * @param val - 需要检查的任意类型值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isNonElementNode(val: any): val is CommentNode {
  // 首先检查该值是否为虚拟节点，如果不是则直接返回false
  if (!isVNode(val)) return false
  // 检查节点类型是否为文本节点或注释节点
  return !(val.type === TEXT_NODE_TYPE || val.type === COMMENT_NODE_TYPE)
}
