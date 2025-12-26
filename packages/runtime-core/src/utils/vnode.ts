import {
  CONTAINER_NODE_KINDS,
  ELEMENT_NODE_KINDS,
  IS_VNODE,
  NodeKind,
  NON_ELEMENT_NODE_KINDS,
  SPECIAL_NODE_KINDS,
  WIDGET_NODE_KINDS
} from '../constants/index.js'
import type {
  CommentNode,
  ContainerNode,
  ElementNode,
  FragmentNode,
  RegularElementNode,
  StatefulWidgetNode,
  StatelessWidgetNode,
  TextNode,
  VNode,
  VoidElementNode,
  WidgetNode
} from '../types/index.js'

/**
 * 检查给定的值是否为虚拟节点(VNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是VNode节点则返回true，否则返回false
 */
export function isVNode(val: any): val is VNode {
  return val && typeof val === 'object' && val[IS_VNODE] === true
}
/**
 * 检查传入的值是否为WidgetNode类型
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是WidgetNode类型则返回true，否则返回false
 */
export function isStatefulWidgetNode(val: any): val is StatefulWidgetNode {
  return isVNode(val) && val.kind === NodeKind.STATEFUL_WIDGET
}
/**
 * 检查给定的值是否为简单组件节点(StatelessWidgetNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是SimpleWidgetNode类型则返回true，否则返回false
 */
export function isStatelessWidgetNode(val: any): val is StatelessWidgetNode {
  return isVNode(val) && val.kind === NodeKind.STATELESS_WIDGET
}
/**
 * 判断给定值是否为Widget节点
 * @param val - 需要判断的值
 * @returns {boolean} 如果值是Widget节点则返回true，否则返回false
 */
export function isWidgetNode(val: any): val is WidgetNode {
  // 首先检查值是否为VNode，然后检查其kind是否为STATEFUL_WIDGET或STATELESS_WIDGET
  return isVNode(val) && WIDGET_NODE_KINDS.has(val.kind)
}
/**
 * 检查给定的值是否为片段虚拟节点(FragmentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isFragmentNode(val: any): val is FragmentNode {
  return isVNode(val) && val.kind === NodeKind.FRAGMENT
}
/**
 * 检查给定的值是否为常规元素节点(RegularElementNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是元素虚拟节点返回true，否则返回false
 */
export function isRegularElementNode(val: any): val is RegularElementNode {
  return isVNode(val) && typeof val.type === 'string' && val.kind === NodeKind.REGULAR_ELEMENT
}
/**
 * 检查一个值是否为空元素虚拟节点
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是空元素虚拟节点则返回true，否则返回false
 */
export function isVoidElementNode(val: any): val is VoidElementNode {
  return isVNode(val) && val.kind === NodeKind.VOID_ELEMENT
}
/**
 * 判断给定的值是否为元素节点
 * @param val 需要判断的值
 * @returns {boolean} 如果是元素节点返回true，否则返回false
 */
export function isElementNode(val: any): val is ElementNode {
  return isVNode(val) && ELEMENT_NODE_KINDS.has(val.kind)
}
/**
 * 检查给定的值是否为文本虚拟节点(TextNode)
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是文本虚拟节点则返回true，否则返回false
 */
export function isTextNode(val: any): val is TextNode {
  return isVNode(val) && val.kind === NodeKind.TEXT
}
/**
 * 检查给定的值是否为注释虚拟节点(CommentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isCommentNode(val: any): val is CommentNode {
  return isVNode(val) && val.kind === NodeKind.COMMENT
}
/**
 * 判断给定的值是否是容器虚拟节点(FragmentNode|RegularElementNode)
 * 容器虚拟节点是指可以包含子节点的虚拟节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是容器虚拟节点则返回true，否则返回false
 */
export function isContainerNode(val: any): val is ContainerNode {
  return isVNode(val) && CONTAINER_NODE_KINDS.has(val.kind)
}
/**
 * 检查给定的值是否为非元素节点(TextNode|CommentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是非元素节点则返回true，否则返回false
 */
export function isNonElementNode(val: any): val is TextNode | CommentNode {
  return isVNode(val) && NON_ELEMENT_NODE_KINDS.has(val.kind)
}

/**
 * 检查给定的值是否为特殊节点(TextNode|CommentNode|FragmentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是特殊节点则返回true，否则返回false
 */
export function isSpecialNode(val: any): val is TextNode | CommentNode | FragmentNode {
  return isVNode(val) && SPECIAL_NODE_KINDS.has(val.kind)
}
