import { NodeKind, NodeState } from '../constants/index.js'
import type { HostParentElement } from '../types/element.js'
import type {
  AnyProps,
  NodeController,
  NodeElementType,
  NodeKindToNodeType,
  OpsType,
  VNode
} from '../types/index.js'
import type { VNodeTypes } from '../types/vnode.js'

type Controllers = {
  [key in NodeKind]: NodeController<NodeKindToNodeType[key]>
}
const controllers: Controllers = {} as Controllers

/**
 * 注册节点控制器
 *
 * @param kind - 节点类型
 * @param controller - 节点控制器实例
 */
export function registerNodeController<K extends NodeKind>(
  kind: K,
  controller: NodeController<NodeKindToNodeType[K]>
): void {
  controllers[kind] = controller as Controllers[K]
}

/**
 * 渲染节点 - 创建元素,这是挂载之前的步骤
 *
 * @param node - 虚拟节点对象
 * @returns 创建的 DOM 元素
 */
export function renderNode<T extends VNodeTypes>(node: VNode<T>): NodeElementType<T> {
  return controllers[node.kind].render(node as VNode<never>) as NodeElementType<T>
}

/**
 * 挂载节点到容器
 *
 * @param node - 虚拟节点
 * @param container - 父容器元素
 * @param opsType - 操作类型
 */
export function mountNode(
  node: VNode,
  container: HostParentElement,
  opsType: OpsType = 'appendChild'
): void {
  if (node.state === NodeState.Created) {
    renderNode(node)
  }
  if (node.state === NodeState.Rendered) {
    controllers[node.kind].mount(node as VNode<never>, container, opsType)
    node.state = NodeState.Activated
  }
  throw new Error(`The node state (${node.state}) is also not in the mountable stage`)
}

/**
 * 激活节点 - 将停用的节点重新激活
 *
 * @param node - 虚拟节点
 * @param root - 是否为根节点
 */
export function activateNode(node: VNode, root: boolean): void {
  if (node.state === NodeState.Deactivated) {
    controllers[node.kind].activate(node as VNode<never>, root)
    node.state = NodeState.Activated
  }
  throw new Error(`The node state (${node.state}) is also not in the activatable stage`)
}

/**
 * 停用节点 - 从 DOM 中移除但保留状态
 *
 * @param node - 虚拟节点
 * @param root - 是否为根节点
 */
export function deactivateNode(node: VNode, root: boolean): void {
  if (node.state === NodeState.Activated) {
    controllers[node.kind].deactivate(node as VNode<never>, root)
    node.state = NodeState.Deactivated
  }
  throw new Error(`The node state (${node.state}) is also not in the deactivatable stage`)
}

/**
 * 卸载节点 - 完全移除节点及其子节点
 *
 * @param node - 虚拟节点
 */
export function unmountNode(node: VNode): void {
  if (node.state === NodeState.Unmounted) {
    throw new Error(`The node state (${node.state}) is also not in the unmountable stage`)
  }
  controllers[node.kind].unmount(node as VNode<never>)
  node.state = NodeState.Unmounted
}

/**
 * 更新节点属性的函数
 * @param node - 需要更新属性的虚拟节点(VNode)
 * @param newProps - 新的属性对象，包含要更新的属性
 * @param newNode - 新的虚拟节点对象，用于获取新的属性对象
 */
export function updateNodeProps(node: VNode, newProps: AnyProps, newNode: VNode) {
  // 根据节点类型调用对应的控制器更新属性
  // 这里使用节点 kind 属性来查找对应的控制器
  // 将节点类型断言为 VNode<never> 以满足控制器类型要求
  controllers[node.kind].updateProps(node as VNode<never>, newProps, newNode as VNode<never>)
}
