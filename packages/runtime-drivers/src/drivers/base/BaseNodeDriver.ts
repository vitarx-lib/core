import type {
  AnyProps,
  HostNodeElements,
  HostParentElement,
  NodeDriver,
  NodeType,
  OpsType,
  VNode
} from '@vitarx/runtime-core'

/**
 * 节点驱动器抽象基类
 *
 * 提供所有节点驱动器的统一生命周期骨架，定义了节点的渲染、挂载、激活、停用和卸载流程。
 * 子类可以通过覆盖钩子方法来实现特定的行为。
 *
 * 核心功能：
 * - 统一的生命周期管理（render → mount → activate → deactivate → unmount）
 * - 可扩展的钩子机制，便于在流程各个阶段插入自定义逻辑
 * - 强制子类实现核心行为方法
 *
 * 使用示例：
 * ```typescript
 * class MyDriver extends BaseNodeDriver<MyNodeType> {
 *   protected doRender(node: VNode<MyNodeType>): void {
 *     // 实现渲染逻辑
 *   }
 *   // ... 实现其他抽象方法
 * }
 * ```
 *
 * @template T - 节点类型，继承自 NodeType
 */
export abstract class BaseNodeDriver<T extends NodeType> implements NodeDriver<T> {
  /**
   * @inheritDoc
   */
  render(node: VNode<T>): void {
    this.beforeRender(node)
    this.doRender(node)
    this.afterRender(node)
  }

  /**
   * @inheritDoc
   */
  mount(node: VNode<T>, target?: HostNodeElements | HostParentElement, opsType?: OpsType): void {
    this.beforeMount(node, target, opsType)
    this.doMount(node, target, opsType)
    this.afterMount(node, target, opsType)
  }

  /**
   * @inheritDoc
   */
  activate(node: VNode<T>, root: boolean): void {
    this.beforeActivate(node, root)
    this.doActivate(node, root)
    this.afterActivate(node, root)
  }

  /**
   * @inheritDoc
   */
  deactivate(node: VNode<T>, root: boolean): void {
    this.beforeDeactivate(node, root)
    this.doDeactivate(node, root)
    this.afterDeactivate(node, root)
  }

  /**
   * @inheritDoc
   */
  unmount(node: VNode<T>): void {
    this.beforeUnmount(node)
    this.doUnmount(node)
    this.afterUnmount(node)
  }

  /**
   * @inheritDoc
   */
  updateProps(node: VNode<T>, newProps: AnyProps, newNode: VNode<T>): void {
    this.beforeUpdateProps(node, newProps, newNode)
    this.doUpdateProps(node, newProps, newNode)
    this.afterUpdateProps(node, newProps, newNode)
  }

  // ==================== 钩子方法（子类可按需覆盖） ====================

  /**
   * 渲染前钩子
   * @param node - 虚拟节点
   */
  protected beforeRender(node: VNode<T>): void {}

  /**
   * 渲染后钩子
   * @param node - 虚拟节点
   */
  protected afterRender(node: VNode<T>): void {}

  /**
   * 挂载前钩子
   * @param node - 虚拟节点
   * @param target - 挂载目标
   * @param opsType - 操作类型
   */
  protected beforeMount(
    node: VNode<T>,
    target?: HostNodeElements | HostParentElement,
    opsType?: OpsType
  ): void {}

  /**
   * 挂载后钩子
   * @param node - 虚拟节点
   * @param target - 挂载目标
   * @param opsType - 操作类型
   */
  protected afterMount(
    node: VNode<T>,
    target?: HostNodeElements | HostParentElement,
    opsType?: OpsType
  ): void {}

  /**
   * 激活前钩子
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected beforeActivate(node: VNode<T>, root: boolean): void {}

  /**
   * 激活后钩子
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected afterActivate(node: VNode<T>, root: boolean): void {}

  /**
   * 停用前钩子
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected beforeDeactivate(node: VNode<T>, root: boolean): void {}

  /**
   * 停用后钩子
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected afterDeactivate(node: VNode<T>, root: boolean): void {}

  /**
   * 卸载前钩子
   * @param node - 虚拟节点
   */
  protected beforeUnmount(node: VNode<T>): void {}

  /**
   * 卸载后钩子
   * @param node - 虚拟节点
   */
  protected afterUnmount(node: VNode<T>): void {}

  /**
   * 属性更新前钩子
   * @param node - 当前虚拟节点
   * @param newProps - 新的属性对象
   * @param newNode - 新的虚拟节点
   */
  protected beforeUpdateProps(node: VNode<T>, newProps: AnyProps, newNode: VNode<T>): void {}

  /**
   * 属性更新后钩子
   * @param node - 当前虚拟节点
   * @param newProps - 新的属性对象
   * @param newNode - 新的虚拟节点
   */
  protected afterUpdateProps(node: VNode<T>, newProps: AnyProps, newNode: VNode<T>): void {}

  // ==================== 抽象方法（子类必须实现） ====================

  /**
   * 执行渲染逻辑
   * @param node - 虚拟节点
   */
  protected abstract doRender(node: VNode<T>): void

  /**
   * 执行挂载逻辑
   * @param node - 虚拟节点
   * @param target - 挂载目标
   * @param opsType - 操作类型
   */
  protected abstract doMount(
    node: VNode<T>,
    target?: HostNodeElements | HostParentElement,
    opsType?: OpsType
  ): void

  /**
   * 执行激活逻辑
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected abstract doActivate(node: VNode<T>, root: boolean): void

  /**
   * 执行停用逻辑
   * @param node - 虚拟节点
   * @param root - 是否为根节点
   */
  protected abstract doDeactivate(node: VNode<T>, root: boolean): void

  /**
   * 执行卸载逻辑
   * @param node - 虚拟节点
   */
  protected abstract doUnmount(node: VNode<T>): void

  /**
   * 执行属性更新逻辑
   * @param node - 当前虚拟节点
   * @param newProps - 新的属性对象
   * @param newNode - 新的虚拟节点
   */
  protected abstract doUpdateProps(node: VNode<T>, newProps: AnyProps, newNode: VNode<T>): void
}
