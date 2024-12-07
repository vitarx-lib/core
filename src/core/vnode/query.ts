import type { VNode, VNodeChild } from './type.js'

// VNode的父节点映射关系缓存
const __ParentMapping__ = new WeakMap<VNodeChild, VNode>()

/**
 * 获取节点的父节点
 *
 * @returns {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 * @param vnode - 自身的虚拟节点对象
 */
export function getParentVNode(vnode: VNodeChild): VNode | undefined {
  return __ParentMapping__.get(vnode)
}

/**
 * 更新父节点映射
 *
 * 该方法提供给框架内部逻辑调用，开发者谨慎调用本方法。
 *
 * @param vnode - 虚拟节点对象
 * @param parent - 父节点
 */
export function __updateParentVNode(vnode: VNodeChild, parent: VNode): void {
  __ParentMapping__.set(vnode, parent)
}
