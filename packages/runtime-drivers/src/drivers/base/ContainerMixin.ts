import type { ContainerNode, ContainerNodeType, HostNodeType } from '@vitarx/runtime-core'
import {
  activateNode,
  deactivateNode,
  mountNode,
  renderNode,
  unmountNode
} from '@vitarx/runtime-core'
import type { BaseHostNodeDriver } from '../base/BaseHostNodeDriver.js'

/**
 * 为元素驱动器混入容器节点处理方法
 *
 * 该函数向驱动器实例添加子节点的渲染、挂载、激活、停用和卸载方法。
 * 适用于支持子节点的元素（如 RegularElement）。
 *
 * @param driver - 宿主节点驱动器实例
 */
export function mixinContainerDriver(driver: BaseHostNodeDriver<ContainerNodeType>) {
  /**
   * 渲染容器节点的所有子节点
   * @param node - 容器节点
   */
  driver['renderChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      renderNode(child)
    }
  }

  /**
   * 挂载容器节点的所有子节点
   * @param node - 容器节点
   */
  driver['mountChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      mountNode(child, node.el)
    }
  }

  /**
   * 激活容器节点的所有子节点
   * @param node - 容器节点
   */
  driver['activateChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      activateNode(child, false)
    }
  }

  /**
   * 停用容器节点的所有子节点
   * @param node - 容器节点
   */
  driver['deactivateChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      deactivateNode(child, false)
    }
  }

  /**
   * 卸载容器节点的所有子节点
   * @param node - 容器节点
   */
  driver['unmountChildren'] = function (node: ContainerNode) {
    for (const child of node.children) {
      unmountNode(child)
    }
  }
}
