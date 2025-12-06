import type {
  AnyProps,
  ElementOf,
  HostCommentElement,
  HostNode,
  HostNodeElements,
  HostNodeType,
  HostParentElement,
  OpsType
} from '@vitarx/runtime-core'
import { findParentNode, getRenderer, isWidgetNode, NodeState } from '@vitarx/runtime-core'
import { BaseNodeDriver } from './BaseNodeDriver.js'

/**
 * 宿主节点驱动器抽象基类
 *
 * 负责管理宿主节点（HostNode）的渲染、挂载、激活、停用和卸载等生命周期。
 * 提供与平台渲染器（HostRenderer）交互的通用逻辑。
 *
 * 核心功能：
 * - 集成 HostRenderer，提供平台无关的元素操作
 * - 管理节点状态转换
 * - 处理 ref 引用、锚点（anchor）等节点元数据
 * - 支持可选的子节点处理（renderChildren、mountChildren 等）
 *
 * @template T - 宿主节点类型，继承自 HostNodeType
 */
export abstract class BaseHostNodeDriver<T extends HostNodeType> extends BaseNodeDriver<T> {
  /**
   * 获取渲染器实例
   */
  protected get dom() {
    return getRenderer()
  }

  /**
   * @inheritDoc
   */
  protected doRender(node: HostNode<T>): void {
    node.el = this.createElement(node)
    this.renderChildren?.(node)
    node.state = NodeState.Rendered
  }

  /**
   * @inheritDoc
   */
  protected doMount(node: HostNode<T>, target?: HostNodeElements, opsType?: OpsType): void {
    // 绑定 ref 引用
    if (node.ref) node.ref.value = node.el
    // 挂载元素到目标容器
    if (node.el && target && !this.dom.getParentElement(node.el)) {
      this.dom[opsType || 'appendChild'](node.el!, target as HostParentElement)
    }
    // 挂载子节点
    this.mountChildren?.(node)
    node.state = NodeState.Activated
  }

  /**
   * @inheritDoc
   */
  protected doActivate(node: HostNode<T>, root: boolean): void {
    // 激活子节点
    this.activateChildren?.(node)
    const { el, anchor } = node
    // 根节点需要替换锚点
    if (root && anchor) {
      this.dom.replace(el!, anchor)
      delete node.anchor
    }
    node.state = NodeState.Activated
  }

  /**
   * @inheritDoc
   */
  protected doDeactivate(node: HostNode<T>, root: boolean): void {
    // 停用子节点
    this.deactivateChildren?.(node)
    const { el } = node
    // 根节点需要创建锚点替换元素
    if (root && el) {
      this.dom.replace(this.createAnchor(node), el)
    }
    node.state = NodeState.Deactivated
  }

  /**
   * @inheritDoc
   */
  protected doUnmount(node: HostNode<T>): void {
    // 卸载子节点
    this.unmountChildren?.(node)
    // 清除 ref 引用
    if (node.ref) {
      node.ref.value = null
    }
    // 移除元素
    if (node.el) {
      this.dom.remove(node.el)
      delete node.el
    }
    // 移除锚点
    if (node.anchor) {
      this.dom.remove(node.anchor)
      delete node.anchor
    }
    node.state = NodeState.Unmounted
  }

  // ==================== 子节点处理方法（可选实现） ====================

  /**
   * 渲染子节点（子类可选实现）
   * @param node - 宿主节点
   */
  protected renderChildren?(node: HostNode<T>): void

  /**
   * 挂载子节点（子类可选实现）
   * @param node - 宿主节点
   */
  protected mountChildren?(node: HostNode<T>): void

  /**
   * 激活子节点（子类可选实现）
   * @param node - 宿主节点
   */
  protected activateChildren?(node: HostNode<T>): void

  /**
   * 停用子节点（子类可选实现）
   * @param node - 宿主节点
   */
  protected deactivateChildren?(node: HostNode<T>): void

  /**
   * 卸载子节点（子类可选实现）
   * @param node - 宿主节点
   */
  protected unmountChildren?(node: HostNode<T>): void

  // ==================== 辅助方法 ====================

  /**
   * 创建一个锚点元素，用于在虚拟节点中标记位置
   * @param node - 需要创建锚点的宿主节点
   * @returns 返回创建或已存在的锚点元素
   */
  protected createAnchor(node: HostNode): HostCommentElement {
    // 如果节点已有锚点，直接返回
    if (node.anchor) return node.anchor
    const parent = findParentNode(node)
    let name: string = node.type
    // 获取父组件的名称
    if (isWidgetNode(parent)) name = parent.instance!.name
    node.anchor = this.dom.createComment(`<${name}> deactivate anchor`)
    return node.anchor
  }

  /**
   * 创建宿主元素
   *
   * 子类必须实现此方法以创建特定类型的宿主元素
   *
   * @param node - 宿主节点
   * @returns 创建的宿主元素
   */
  protected abstract createElement(node: HostNode<T>): ElementOf<T>

  /**
   * @inheritDoc
   */
  protected abstract override doUpdateProps(
    node: HostNode<T>,
    newProps: AnyProps,
    newNode: HostNode<T>
  ): void
}
