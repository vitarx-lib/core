import { isFunction } from '@vitarx/utils/src/index'
import type { NoTagNodeElementName } from '../../renderer/index'
import type {
  CommentVNode,
  ElementVNode,
  FragmentVNode,
  NoTagVNode,
  TextNode,
  VNode,
  VNodeType,
  WidgetVNode
} from '../types/nodes'
import { Fragment, VNodeSymbol } from './constant'
import { findParentVNode } from './relationships'

/**
 * 判断是否为有效的VNode类型
 *
 * @param {any} type - 要检查的类型
 * @returns {boolean} 如果是有效的VNode类型则返回true
 */
export function isValidVNodeType(type: any): type is VNodeType {
  return typeof type === 'string' || isFunction(type) || type === Fragment
}

/**
 * 判断是否为无标签VNode类型（文本节点或注释节点）
 *
 * @param {any} type - 要检查的类型
 * @returns {boolean} 如果是无标签VNode类型则返回true
 */
export function isNoTagVNodeType(type: any): type is NoTagNodeElementName {
  return type === 'text-node' || type === 'comment-node'
}

/**
 * 判断对象是否为VNode
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是VNode则返回true
 */
export function isVNode(obj: any): obj is VNode {
  return obj?.[VNodeSymbol] === true
}

/**
 * 判断对象是否为元素VNode（HTML标签节点）
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是元素VNode则返回true
 */
export function isElementVNode(obj: any): obj is ElementVNode {
  return typeof obj?.type === 'string'
}

/**
 * 判断对象是否为Widget VNode（函数组件节点）
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是Widget VNode则返回true
 */
export function isWidgetVNode(obj: any): obj is WidgetVNode {
  return typeof obj?.type === 'function'
}

/**
 * 判断对象是否为文本节点
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是文本节点则返回true
 */
export function isTextVNode(obj: any): obj is TextNode {
  return obj?.type === 'text-node'
}

/**
 * 判断对象是否为注释节点
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是注释节点则返回true
 */
export function isCommentVNode(obj: any): obj is CommentVNode {
  return obj?.type === 'comment-node'
}

/**
 * 判断对象是否为无标签元素节点（文本节点或注释节点）
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是无标签元素节点则返回true
 */
export function isNoTagVNode(obj: any): obj is NoTagVNode {
  return obj?.type === 'text-node' || obj?.type === 'comment-node'
}

/**
 * 判断对象是否为Fragment节点
 *
 * @param {any} obj - 要检查的对象
 * @returns {boolean} 如果对象是Fragment节点则返回true
 */
export function isFragmentVNode(obj: any): obj is FragmentVNode {
  return obj?.type === Fragment
}

/**
 * 判断是否为svg节点
 *
 * @param vnode - ElementVNode
 * @returns {boolean}
 */
export function isSvgVNode(vnode: ElementVNode): boolean {
  const svgNamespace = 'http://www.w3.org/2000/svg'
  if (vnode.props?.xmlns === svgNamespace) return true
  if (vnode.type === 'svg') return true
  let parent = findParentVNode(vnode)
  while (parent) {
    if (parent.type === 'svg') return true
    parent = findParentVNode(parent)
  }
  return false
}
