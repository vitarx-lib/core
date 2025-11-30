import { getRenderer } from '../renderer/index.js'
import type { ContainerVNode, ContainerVNodeType } from '../types/index.js'
import { activateNode, deactivateNode, mountNode, renderNode, unmountNode } from '../vnode/index.js'
import { HostNodeController } from './HostNodeController.js'

/**
 * 为容器节点控制器混入子节点处理方法
 * @param controller - 容器节点控制器实例，类型为 HostNodeController<ContainerVNodeType>
 */
export function mixinContainerController(controller: HostNodeController<ContainerVNodeType>) {
  /**
   * 渲染容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  controller['renderChildren'] = function (node: ContainerVNode) {
    const dom = getRenderer()
    for (const child of node.children) {
      const el = renderNode(child) // 遍历并渲染每个子节点
      dom.appendChild(el, node.el!)
    }
  }
  /**
   * 挂载容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表和DOM元素引用
   */
  controller['mountChildren'] = function (node: ContainerVNode) {
    for (const child of node.children) {
      mountNode(child) // 挂载每个子节点到容器的DOM元素上
    }
  }
  /**
   * 激活容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  controller['activateChildren'] = function (node: ContainerVNode) {
    for (const child of node.children) {
      activateNode(child, false) // 激活每个子节点，不触发过渡效果
    }
  }
  /**
   * 停用容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  controller['deactivateChildren'] = function (node: ContainerVNode) {
    for (const child of node.children) {
      deactivateNode(child, false) // 停用每个子节点，不触发过渡效果
    }
  }
  /**
   * 卸载容器节点的所有子节点
   * @param node - 容器虚拟节点，包含子节点列表
   */
  controller['unmountChildren'] = function (node: ContainerVNode) {
    for (const child of node.children) {
      unmountNode(child) // 卸载每个子节点
    }
  }
}
