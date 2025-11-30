import type { HostNodeElements, HostParentElement } from './element.js'
import type { VNode } from './nodes/index.js'
import type { NodeElementType, VNodeTypes } from './vnode.js'
import type { AnyProps } from './widget.js'

export type OpsType = 'appendChild' | 'insertBefore' | 'replace'
export interface NodeController<T extends VNodeTypes> {
  /**
   * 渲染节点 - 创建元素，这是挂载之前的步骤
   *
   * @param node - 虚拟节点对象
   */
  render(node: VNode<T>): NodeElementType<T>
  /**
   * 挂载节点
   *
   * @param node - 虚拟节点对象
   * @param [target] - 挂载目标
   * @param [opsType='appendChild'] - 默认追加
   */
  mount(node: VNode<T>, target?: HostNodeElements | HostParentElement, opsType?: OpsType): void
  /**
   * 节点被激活
   *
   * @param node
   * @param root
   */
  activate(node: VNode<T>, root: boolean): void
  /**
   * 节点被停用
   *
   * @param node
   * @param root
   */
  deactivate(node: VNode<T>, root: boolean): void
  /**
   * 节点被卸载
   *
   * @param node
   */
  unmount(node: VNode<T>): void
  /**
   * 更新节点属性
   *
   * @param node - 当前虚拟节点
   * @param newProps - 新的属性对象
   * @param newNode - 新的虚拟节点
   */
  updateProps(node: VNode<T>, newProps: AnyProps, newNode: VNode<T>): void
}
