import { ContainerNode, VNode } from '../base/index.js'
import { NodeShapeFlags, VIRTUAL_NODE_SYMBOL } from '../constants/index.js'
import type { ElementNode, StatelessWidgetNode } from '../nodes/index.js'
import {
  CommentNode,
  FragmentNode,
  StatefulWidgetNode,
  TextNode,
  VoidElementVNode
} from '../nodes/index.js'

/**
 * 检查给定的值是否为虚拟节点(VNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是VNode节点则返回true，否则返回false
 */
export function isVNode(val: any): val is VNode {
  return val && typeof val === 'object' && val[VIRTUAL_NODE_SYMBOL] === true
}

/**
 * 检查传入的值是否为WidgetNode类型
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是WidgetNode类型则返回true，否则返回false
 */
export function isStatefulWidgetNode(val: any): val is StatefulWidgetNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.STATEFUL_WIDGET
}

/**
 * 检查给定的值是否为简单组件节点(StatelessWidgetNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是SimpleWidgetNode类型则返回true，否则返回false
 */
export function isStatelessWidgetNode(val: any): val is StatelessWidgetNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.STATELESS_WIDGET
}

/**
 * 检查给定的值是否为片段虚拟节点(FragmentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是片段虚拟节点返回true，否则返回false
 */
export function isFragmentNode(val: any): val is FragmentNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.FRAGMENT
}

/**
 * 检查给定的值是否为HTML元素节点(ElementNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是元素虚拟节点返回true，否则返回false
 */
export function isElementNode(val: any): val is ElementNode {
  return isVNode(val) && typeof val.type === 'string' && val.shapeFlags === NodeShapeFlags.ELEMENT
}

/**
 * 检查一个值是否为空元素虚拟节点
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是空元素虚拟节点则返回true，否则返回false
 */
export function isVoidElementNode(val: any): val is VoidElementVNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.VOID_ELEMENT
}

/**
 * 检查给定的值是否为文本虚拟节点(TextNode)
 *
 * @param val - 要检查的值
 * @returns {boolean} 如果值是文本虚拟节点则返回true，否则返回false
 */
export function isTextNode(val: any): val is TextNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.TEXT
}

/**
 * 检查给定的值是否为注释虚拟节点(CommentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是注释虚拟节点则返回true，否则返回false
 */
export function isCommentNode(val: any): val is CommentNode {
  return isVNode(val) && val.shapeFlags === NodeShapeFlags.COMMENT
}

/**
 * 判断给定的值是否是容器虚拟节点(FragmentNode|ElementNode)
 * 容器虚拟节点是指可以包含子节点的虚拟节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是容器虚拟节点则返回true，否则返回false
 */
export function isContainerNode(val: any): val is ContainerNode {
  return (
    isVNode(val) &&
    (val.shapeFlags === NodeShapeFlags.ELEMENT || val.shapeFlags === NodeShapeFlags.FRAGMENT)
  )
}

/**
 * 检查给定的值是否为非元素节点(TextNode|CommentNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是非元素节点则返回true，否则返回false
 */
export function isNonElementNode(val: any): val is TextNode | CommentNode {
  return (
    isVNode(val) &&
    (val.shapeFlags === NodeShapeFlags.TEXT || val.shapeFlags === NodeShapeFlags.COMMENT)
  )
}
