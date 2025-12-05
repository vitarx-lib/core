import type { ContainerNode, ContainerNodeType } from '@vitarx/runtime-core'
import {
  activateNode,
  deactivateNode,
  mountNode,
  renderNode,
  unmountNode
} from '@vitarx/runtime-core'
import { HostNodeDriver } from './HostNodeDriver.js'

/**
 * 为容器节点驱动器混入子节点处理方法
 * @param driver - 容器节点驱动器实例，类型为 HostNodeDriver<ContainerVNodeType>
 */
export function mixinContainerDriver(driver: HostNodeDriver<ContainerNodeType>) {
  /**
   * 渲染容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  driver['renderChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      renderNode(child) // 遍历并渲染每个子节点
    }
  }
  /**
   * 挂载容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表和DOM元素引用
   */
  driver['mountChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      mountNode(child, node.el) // 挂载每个子节点到容器的DOM元素上
    }
  }
  /**
   * 激活容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  driver['activateChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      activateNode(child, false) // 激活每个子节点，不触发过渡效果
    }
  }
  /**
   * 停用容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  driver['deactivateChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      deactivateNode(child, false) // 停用每个子节点，不触发过渡效果
    }
  }
  /**
   * 卸载容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  driver['unmountChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      unmountNode(child) // 卸载每个子节点
    }
  }
}
