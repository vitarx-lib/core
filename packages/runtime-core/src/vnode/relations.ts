import type { VNode } from '../types/index.js'

const PARENT_NODE_MAPPING = new WeakMap<VNode, VNode>()

/**
 * 链接父映射
 *
 * @param child - 子节点
 * @param parent - 父节点
 */
export function linkParentNode(child: VNode, parent: VNode) {
  PARENT_NODE_MAPPING.set(child, parent)
}

/**
 * 查找父节点
 *
 * @param {VNode} vnode - 虚拟节点对象
 * @return {VNode|undefined} - 如果存在父节点则返回父节点的VNode对象
 */
export function findParentNode(vnode: VNode): VNode | undefined {
  return PARENT_NODE_MAPPING.get(vnode)
}

/**
 * 移除父节点映射
 *
 * @param vnode - 需要从父节点映射中移除的虚拟节点
 */
export function unlinkParentNode(vnode: VNode): void {
  // 检查虚拟节点是否存在于父节点映射中
  if (PARENT_NODE_MAPPING.has(vnode)) {
    // 如果存在，则从映射中删除该虚拟节点
    PARENT_NODE_MAPPING.delete(vnode)
  }
}
