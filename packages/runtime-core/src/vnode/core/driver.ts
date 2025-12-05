import { logger } from '@vitarx/utils'
import { NodeKind, NodeState } from '../../constants/index.js'
import { unlinkParentNode } from '../../runtime/index.js'
import type {
  AnyProps,
  ElementOf,
  HostNodeElements,
  HostParentElement,
  NodeDriver,
  NodeKindToNodeType,
  NodeType,
  OpsType,
  VNode
} from '../../types/index.js'
import { __DEV__ } from '../../utils/index.js'

type Drivers = {
  [key in NodeKind]: NodeDriver<NodeKindToNodeType[key]>
}
const drivers: Drivers = {} as Drivers
let defaultDriver: NodeDriver<NodeType> | null = null
/**
 * 注册节点驱动器
 *
 * @param kind - 节点类型
 * @param driver - 节点控制器实例
 */
export function registerDriver<K extends NodeKind>(
  kind: K,
  driver: NodeDriver<NodeKindToNodeType[K]>
): void {
  drivers[kind] = driver as Drivers[K]
}
/**
 * 设置默认驱动程序
 *
 * `setDefaultDriver` 可以注册一个默认的驱动程序，
 * 该驱动程序将用于处理所有未注册的节点类型
 *
 * @param driver - 默认驱动程序实例，如果传入null，则清除默认驱动程序
 */
export function setDefaultDriver(driver: NodeDriver<NodeType> | null) {
  defaultDriver = driver
}
/**
 * 根据节点类型获取对应的驱动程序
 * @param {NodeKind} kind 节点类型，必须是 NodeKind 的子类型
 * @returns {object} 返回与节点类型对应的驱动程序
 * @throws Error 如果没有找到对应的驱动程序，抛出错误
 */
export function getNodeDriver<K extends NodeKind>(kind: K): Drivers[K] {
  // 从驱动程序映射表中获取指定类型的驱动程序
  const driver = (drivers[kind] as Drivers[K]) || defaultDriver
  // 检查驱动程序是否存在
  if (!driver) {
    // 如果不存在，抛出错误并提示用户可能需要导入平台特定的驱动程序
    throw new Error(
      `No driver registered for node kind "${kind}". ` +
        `You may need to import a platform driver (e.g. runtime-dom / runtime-ssr).`
    )
  }
  // 返回找到的驱动程序
  return driver
}
/**
 * 渲染节点 - 创建元素,这是挂载之前的步骤
 *
 * @param node - 虚拟节点对象
 * @returns 创建的 DOM 元素
 */
export function renderNode<T extends NodeType>(node: VNode<T>): ElementOf<T> {
  if (node.state === NodeState.Rendered) {
    return node.el! as ElementOf<T>
  }
  if (node.state === NodeState.Created) {
    return getNodeDriver(node.kind).render(node as any) as ElementOf<T>
  }
  throw new Error(`The node state (${node.state}) cannot be rendered`)
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
  container?: HostParentElement | HostNodeElements,
  opsType?: OpsType
): void {
  if (node.state !== NodeState.Rendered) renderNode(node)
  getNodeDriver(node.kind).mount(node as any, container, opsType)
  return
}

/**
 * 激活节点 - 将停用的节点重新激活
 *
 * @param node - 虚拟节点
 * @param [root=true] - 是否为根节点
 */
export function activateNode(node: VNode, root: boolean = true): void {
  if (node.state === NodeState.Deactivated) {
    getNodeDriver(node.kind).activate(node as any, root)
    return
  }
  throw new Error(`The node state (${node.state}) cannot be activated`)
}

/**
 * 停用节点 - 从 DOM 中移除但保留状态
 *
 * @param node - 虚拟节点
 * @param [root=true] - 是否为根节点
 */
export function deactivateNode(node: VNode, root: boolean = true): void {
  if (node.state === NodeState.Activated) {
    getNodeDriver(node.kind).deactivate(node as any, root)
    return
  }
  throw new Error(`The node state (${node.state}) cannot be deactivated`)
}

/**
 * 卸载节点 - 完全移除节点及其子节点
 *
 * @param node - 虚拟节点
 */
export function unmountNode(node: VNode): void {
  if (__DEV__ && node.state === NodeState.Unmounted) {
    logger.warn(
      `unmountNode() - the node is already uninstalled, so there is no need to uninstall it repeatedly`
    )
    return
  }
  getNodeDriver(node.kind).unmount(node as any)
  unlinkParentNode(node)
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
  getNodeDriver(node.kind).updateProps(node as any, newProps, newNode as any)
}
