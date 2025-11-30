import { NodeState } from '../constants/index.js'
import { getRenderer } from '../renderer/index.js'
import { findParentNode } from '../runtime/index.js'
import type {
  AnyProps,
  HostCommentElement,
  HostNodeElements,
  HostVNode,
  HostVNodeType,
  NodeController,
  NodeElementType,
  OpsType
} from '../types/index.js'
import { isWidgetNode } from '../utils/index.js'

/**
 * 宿主节点控制器抽象基类
 *
 * 负责管理 DOM 节点的渲染、挂载、激活、停用和卸载等生命周期
 */
export abstract class HostNodeController<T extends HostVNodeType> implements NodeController<T> {
  /** 获取渲染器实例 */
  protected get dom() {
    return getRenderer()
  }
  /**
   * @inheritDoc
   */
  abstract updateProps(node: HostVNode<T>, newProps: AnyProps): void
  /**
   * 渲染节点 - 创建 DOM 元素但不挂载
   *
   * @param node - 虚拟节点
   * @returns 创建的 DOM 元素
   */
  render(node: HostVNode<T>): NodeElementType<T> {
    if (!node.el) node.el = this.createElement(node)
    if (node.ref) node.ref.value = node.el
    this.renderChildren?.(node)
    node.state = NodeState.Rendered
    return node.el
  }
  /**
   * @inheritDoc
   */
  mount(node: HostVNode<T>, target?: HostNodeElements, opsType?: OpsType): void {
    if (target) this.dom[opsType || 'appendChild'](node.el!, target)
    this.mountChildren?.(node)
    node.state = NodeState.Activated
  }
  /**
   * @inheritDoc
   */
  activate(node: HostVNode<T>, root: boolean): void {
    this.activateChildren?.(node)
    const { el, anchor } = node
    if (root) {
      this.dom.replace(el!, anchor!)
      delete node.anchor
    }
    node.state = NodeState.Activated
  }
  /**
   * @inheritDoc
   */
  deactivate(node: HostVNode<T>, root: boolean): void {
    this.deactivateChildren?.(node)
    const { el } = node // 从节点中解构获取teleportTarget和el属性
    if (root) {
      // 如果是根节点 用锚点元素替换当前元素
      this.dom.replace(this.createAnchor(node), el!)
    }
    node.state = NodeState.Deactivated
  }
  /**
   * @inheritDoc
   */
  unmount(node: HostVNode<T>): void {
    this.unmountChildren?.(node)
    if (node.ref) {
      node.ref.value = null
    }
    if (node.el) {
      this.dom.remove(node.el)
      delete node.el
    }
    if (node.anchor) {
      this.dom.remove(node.anchor)
      delete node.anchor
    }
    node.state = NodeState.Unmounted
  }
  /**
   * 创建 DOM 元素
   *
   * @param node - 虚拟节点
   * @returns 创建的 DOM 元素
   */
  protected abstract createElement(node: HostVNode<T>): NodeElementType<T>
  /** 渲染子节点（可选实现） */
  protected renderChildren?(node: HostVNode<T>): void
  /** 挂载子节点（可选实现） */
  protected mountChildren?(node: HostVNode<T>): void
  /** 激活子节点（可选实现） */
  protected activateChildren?(node: HostVNode<T>): void
  /** 停用子节点（可选实现） */
  protected deactivateChildren?(node: HostVNode<T>): void
  /** 卸载子节点（可选实现） */
  protected unmountChildren?(node: HostVNode<T>): void
  /**
   * 创建一个锚点元素，用于在虚拟节点中标记位置
   * @param node - 需要创建锚点的虚拟节点(VNode)
   * @returns {HostCommentElement} 返回创建或已存在的锚点元素(HostCommentElement)
   */
  protected createAnchor(node: HostVNode): HostCommentElement {
    // 如果节点已有锚点，直接返回
    if (node.anchor) return node.anchor
    const parent = findParentNode(node)
    let name: string = node.type
    // 获取父组件的名称
    if (isWidgetNode(parent)) name = parent.runtimeInstance!.name
    node.anchor = this.dom.createComment(`<${name}> deactivate anchor`)
    return node.anchor
  }
}
