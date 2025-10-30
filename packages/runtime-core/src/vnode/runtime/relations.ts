import { VNode } from '../base/index.js'

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
