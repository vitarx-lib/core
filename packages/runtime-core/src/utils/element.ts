import type { ElementOf, HostNodeElements, NodeType, VNode } from '../types/index.js'

/**
 * 获取虚拟节点对应的DOM元素
 *
 * @internal
 * @template T - 虚拟节点的类型
 * @param node - 虚拟节点，可以是任意有效的VNode类型
 * @returns {ElementOf<T>} 返回与虚拟节点对应的DOM元素
 * @throws {Error} 如果节点尚未渲染，会抛出错误
 */
export function getNodeElement<T extends NodeType>(node: VNode<T>): ElementOf<T> {
  // 检查节点是否已经渲染，如果没有则抛出错误
  if (!node.el) throw new Error('node is not rendered')
  // 返回节点的DOM元素
  return node.el as ElementOf<T>
}
/**
 * 获取节点的操作目标元素
 *
 * 操作目标是其与虚拟节点树位置所能对应的元素，有可能是node.el，也可能是node.anchor
 *
 * @internal
 * @param node - 虚拟节点对象
 * @returns {HostNodeElements} 返回节点的操作目标元素类型
 * @throws {Error} 如果节点未渲染，抛出错误
 */
export function getNodeDomOpsTarget(node: VNode): HostNodeElements {
  // 检查节点是否存在对应的DOM元素
  if (!node.el) throw new Error('The node is not rendered')
  return node.anchor || node.el
}
