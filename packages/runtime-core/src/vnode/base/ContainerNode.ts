import type { ContainerNodeType, RuntimeVNodeChildren } from '../../types/index.js'
import { HostNode } from '../base/index.js'

/**
 * 容器节点接口，继承自 HostNode
 *
 * ContainerNode 是一个接口约束，用于描述具有子节点的容器节点。
 * 容器节点可以包含其他节点作为其子节点，并负责管理这些子节点的生命周期。
 *
 * @template T - 容器节点类型，默认为 ContainerNodeType
 * @interface ContainerNode
 * @extends HostNode<T>
 * @property {RuntimeVNodeChildren} children - 容器节点的子节点集合
 *
 * 可以通过 `mixinContainerNode` api 将容器节点的响应逻辑扩展进节点实例中。
 */
export interface ContainerNode<T extends ContainerNodeType = ContainerNodeType>
  extends HostNode<T> {
  /**
   * 运行时子节点列表
   *
   * @type {RuntimeVNodeChildren}
   * @readonly 此属性虽然是公开的，但请不要修改它，会导致节点树结构异常，仅内部patch时会替换为新的子节点列表
   */
  children: RuntimeVNodeChildren
}

/**
 * 将容器节点相关的方法混入到节点实例中
 *
 * 这个函数为容器节点添加管理子节点生命周期的能力，包括挂载、卸载、激活、
 * 停用和渲染子节点的方法。
 *
 * @param {ContainerNode} node - 需要混入容器节点能力的节点实例
 */
export const mixinContainerNode = (node: ContainerNode) => {
  /**
   * 挂载所有子节点到DOM中
   * @this ContainerNode
   */
  node['mountChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.mount()
    }
  }

  /**
   * 卸载所有子节点
   * @this ContainerNode
   */
  node['unmountChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.unmount(false)
    }
  }

  /**
   * 激活所有子节点
   * 激活通常指将节点从非活动状态转换为活动状态
   * @this ContainerNode
   */
  node['activateChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.activate()
    }
  }

  /**
   * 停用所有子节点
   * 停用通常指将节点从活动状态转换为非活动状态
   * @this ContainerNode
   */
  node['deactivateChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.deactivate()
    }
  }

  /**
   * 渲染所有子节点并将其添加到DOM中
   * @this ContainerNode
   */
  node['renderChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.render()
      this.dom.appendChild(this.element, child.operationTarget)
    }
  }
}
