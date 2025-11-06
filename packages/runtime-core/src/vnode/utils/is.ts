import { useDomAdapter } from '../../adapter/index.js'
import type { ValidNodeType } from '../../types/index.js'
import { ContainerNode, ElementNode, VNode, WidgetNode } from '../base/index.js'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  NodeShapeFlags,
  TEXT_NODE_TYPE,
  VIRTUAL_NODE_SYMBOL
} from '../constants/index.js'
import type { RegularElementNode, StatelessWidgetNode } from '../nodes/index.js'
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
 * 判断给定值是否为Widget节点
 * @param val - 需要判断的值
 * @returns {boolean} 如果值是Widget节点则返回true，否则返回false
 */
export function isWidgetNode(val: any): val is WidgetNode {
  // 首先检查值是否为VNode，然后检查其shapeFlags是否为STATEFUL_WIDGET或STATELESS_WIDGET
  return (
    isVNode(val) &&
    (val.shapeFlags === NodeShapeFlags.STATEFUL_WIDGET ||
      val.shapeFlags === NodeShapeFlags.STATELESS_WIDGET)
  )
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
 * 检查给定的值是否为常规元素节点(RegularElementNode)
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是元素虚拟节点返回true，否则返回false
 */
export function isRegularElementNode(val: any): val is RegularElementNode {
  return (
    isVNode(val) &&
    typeof val.type === 'string' &&
    val.shapeFlags === NodeShapeFlags.REGULAR_ELEMENT
  )
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
 * 判断给定的值是否为元素节点
 * @param val 需要判断的值
 * @returns {boolean} 如果是元素节点返回true，否则返回false
 */
export function isElementNode(val: any): val is ElementNode {
  return (
    isVNode(val) && // 首先判断是否为虚拟节点
    (val.shapeFlags === NodeShapeFlags.REGULAR_ELEMENT || // 判断是否为普通元素节点
      val.shapeFlags === NodeShapeFlags.FRAGMENT) // 或者片段节点
  )
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
 * 判断给定的值是否是容器虚拟节点(FragmentNode|RegularElementNode)
 * 容器虚拟节点是指可以包含子节点的虚拟节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是容器虚拟节点则返回true，否则返回false
 */
export function isContainerNode(val: any): val is ContainerNode {
  return (
    isVNode(val) &&
    (val.shapeFlags === NodeShapeFlags.REGULAR_ELEMENT ||
      val.shapeFlags === NodeShapeFlags.FRAGMENT)
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

/**
 * 判断是否支持子节点
 *
 * @param type - 节点类型
 * @returns {boolean} 是否支持子节点
 */
export const isSupportChildren = (type: ValidNodeType): boolean => {
  if (typeof type === 'string') {
    switch (type) {
      case COMMENT_NODE_TYPE:
      case TEXT_NODE_TYPE:
        return false
      case FRAGMENT_NODE_TYPE:
      case DYNAMIC_RENDER_TYPE:
        return true
      default:
        return !useDomAdapter().isVoidElement(type)
    }
  }
  return true
}
