import type {
  AnyProps,
  ElementOf,
  HostCommentElement,
  HostNode,
  HostNodeElements,
  HostNodeType,
  HostParentElement,
  NodeDriver,
  OpsType
} from '@vitarx/runtime-core'
import { findParentNode, getRenderer, isWidgetNode, NodeState } from '@vitarx/runtime-core'

/**
 * 宿主节点驱动器抽象基类
 *
 * 负责管理宿主节点（HostNode）的渲染、挂载、激活、停用和卸载等生命周期。
 * 提供与平台渲染器（HostRenderer）交互的通用逻辑。
 *
 * 核心功能：
 * - 统一的生命周期管理（render → mount → activate → deactivate → unmount）
 * - 可扩展的钩子机制，便于在流程各个阶段插入自定义逻辑
 * - 集成 HostRenderer，提供平台无关的元素操作
 * - 管理节点状态转换
 * - 处理 ref 引用、锚点（anchor）等节点元数据
 * - 支持可选的子节点处理（renderChildren、mountChildren 等）
 *
 * @template T - 宿主节点类型，继承自 HostNodeType
 */
export abstract class BaseHostNodeDriver<T extends HostNodeType> implements NodeDriver<T> {
  /**
   * 获取渲染器实例
   */
  protected get dom() {
    return getRenderer()
  }

  // ==================== 生命周期方法 ====================

  /**
   * @inheritDoc
   */
  render(node: HostNode<T>): void {
    this.beforeRender(node)
    node.el = this.createElement(node)
    this.renderChildren?.(node)
    node.state = NodeState.Rendered
    this.afterRender(node)
  }

  /**
   * @inheritDoc
   */
  mount(node: HostNode<T>, target?: HostNodeElements | HostParentElement, opsType?: OpsType): void {
    this.beforeMount(node, target, opsType)
    // 绑定 ref 引用
    if (node.ref) node.ref.value = node.el
    // 挂载元素到目标容器
    if (node.el && target && !this.dom.getParentElement(node.el)) {
      this.dom[opsType || 'appendChild'](node.el!, target as HostParentElement)
    }
    // 挂载子节点
    this.mountChildren?.(node)
    node.state = NodeState.Activated
    this.afterMount(node, target, opsType)
  }

  /**
   * @inheritDoc
   */
  activate(node: HostNode<T>, root: boolean): void {
    this.beforeActivate(node, root)
    // 激活子节点
    this.activateChildren?.(node)
    const { el, anchor } = node
    // 根节点需要替换锚点
    if (root && anchor) {
      this.dom.replace(el!, anchor)
      delete node.anchor
    }
    node.state = NodeState.Activated
    this.afterActivate(node, root)
  }

  /**
   * @inheritDoc
   */
  deactivate(node: HostNode<T>, root: boolean): void {
    this.beforeDeactivate(node, root)
    // 停用子节点
    this.deactivateChildren?.(node)
    const { el } = node
    // 根节点需要创建锚点替换元素
    if (root && el) {
      this.dom.replace(this.createAnchor(node), el)
    }
    node.state = NodeState.Deactivated
    this.afterDeactivate(node, root)
  }

  /**
   * @inheritDoc
   */
  unmount(node: HostNode<T>): void {
    this.beforeUnmount(node)
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
    this.afterUnmount(node)
  }

  /**
   * @inheritDoc
   */
  updateProps(node: HostNode<T>, newProps: AnyProps): void {
    this.beforeUpdateProps(node, newProps)
    this.doUpdateProps(node, newProps)
    this.afterUpdateProps(node, newProps)
  }

  /**
   * 渲染前钩子
   * @param node - 宿主节点
   */
  protected beforeRender(node: HostNode<T>): void {}

  /**
   * 渲染后钩子
   * @param node - 宿主节点
   */
  protected afterRender(node: HostNode<T>): void {}

  /**
   * 挂载前钩子
   * @param node - 宿主节点
   * @param target - 挂载目标
   * @param opsType - 操作类型
   */
  protected beforeMount(
    node: HostNode<T>,
    target?: HostNodeElements | HostParentElement,
    opsType?: OpsType
  ): void {}

  /**
   * 挂载后钩子
   * @param node - 宿主节点
   * @param target - 挂载目标
   * @param opsType - 操作类型
   */
  protected afterMount(
    node: HostNode<T>,
    target?: HostNodeElements | HostParentElement,
    opsType?: OpsType
  ): void {}

  /**
   * 激活前钩子
   * @param node - 宿主节点
   * @param root - 是否为根节点
   */
  protected beforeActivate(node: HostNode<T>, root: boolean): void {}

  /**
   * 激活后钩子
   * @param node - 宿主节点
   * @param root - 是否为根节点
   */
  protected afterActivate(node: HostNode<T>, root: boolean): void {}

  /**
   * 停用前钩子
   * @param node - 宿主节点
   * @param root - 是否为根节点
   */
  protected beforeDeactivate(node: HostNode<T>, root: boolean): void {}

  /**
   * 停用后钩子
   * @param node - 宿主节点
   * @param root - 是否为根节点
   */
  protected afterDeactivate(node: HostNode<T>, root: boolean): void {}

  /**
   * 卸载前钩子
   * @param node - 宿主节点
   */
  protected beforeUnmount(node: HostNode<T>): void {}

  /**
   * 卸载后钩子
   * @param node - 宿主节点
   */
  protected afterUnmount(node: HostNode<T>): void {}

  /**
   * 属性更新前钩子
   * @param node - 宿主节点
   * @param newProps - 新的属性对象
   */
  protected beforeUpdateProps(node: HostNode<T>, newProps: AnyProps): void {}

  /**
   * 属性更新后钩子
   * @param node - 宿主节点
   * @param newProps - 新的属性对象
   */
  protected afterUpdateProps(node: HostNode<T>, newProps: AnyProps): void {}

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
   * 执行属性更新逻辑
   * @param node - 宿主节点
   * @param newProps - 新的属性对象
   */
  protected abstract doUpdateProps(node: HostNode<T>, newProps: AnyProps): void
}
