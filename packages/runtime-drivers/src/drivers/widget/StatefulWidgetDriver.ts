import { flushSync } from '@vitarx/responsive'
import {
  type AnyProps,
  createCommentVNode,
  createWidgetRuntime,
  forceUpdateProps,
  type HostNodeElements,
  isVNode,
  LifecycleHook,
  NodeState,
  type OpsType,
  renderNode,
  type StatefulWidgetNode,
  type StatefulWidgetNodeType,
  type VNode
} from '@vitarx/runtime-core'
import { BaseWidgetDriver } from '../base/index.js'

/**
 * StatefulWidgetDriver 是用于管理有状态组件(StatefulWidget)生命周期的驱动器类。
 * 它继承自 BaseWidgetDriver，负责处理有状态组件的属性更新、渲染、挂载、激活、停用和卸载等核心操作。
 *
 * 核心功能：
 * - 属性更新管理：处理组件属性的变化并触发相应的更新
 * - 渲染控制：管理组件的渲染过程，包括错误处理
 * - 生命周期管理：控制组件的挂载、激活、停用和卸载等生命周期状态
 *
 * 构造函数参数：
 * - 无特定构造函数参数，继承自 BaseWidgetDriver
 *
 * 使用示例：
 * ```typescript
 * const controller = new StatefulWidgetDriver();
 * // 在框架内部使用，通常不需要直接实例化
 * ```
 *
 * 特殊说明：
 * - 该类通常由框架内部使用，开发者一般不需要直接操作
 * - 组件的生命周期钩子会按照特定顺序触发
 * - 错误处理机制会在渲染失败时自动创建错误节点
 */
export class StatefulWidgetDriver extends BaseWidgetDriver<StatefulWidgetNodeType> {
  /** @inheritDoc */
  override updateProps(node: StatefulWidgetNode, newProps: AnyProps): void {
    const changedKeys = forceUpdateProps(() => this.diffProps(node.instance!.props, newProps))
    // 如果有属性变化，触发更新
    if (changedKeys.length > 0) flushSync()
  }
  /** @inheritDoc */
  override render(node: VNode<StatefulWidgetNodeType>): void {
    const widget = createWidgetRuntime(node)
    // 触发render生命周期钩子
    widget.invokeHook(LifecycleHook.render)
    try {
      super.render(node)
    } catch (e) {
      const errVNode = widget.reportError(e, 'render')
      widget.cachedChildVNode = isVNode(errVNode)
        ? errVNode
        : createCommentVNode({ text: `StatefulWidget<${widget.name}> render fail` })
      // 获取更新后的DOM元素
      renderNode(widget.cachedChildVNode)
    }
  }
  /** @inheritDoc */
  override mount(node: StatefulWidgetNode, target?: HostNodeElements, opsType?: OpsType): void {
    const runtimeInstance = node.instance!
    runtimeInstance.invokeHook(LifecycleHook.beforeMount)
    // 绑定 ref 引用
    if (node.ref) node.ref.value = runtimeInstance.instance
    super.mount(node, target, opsType)
    runtimeInstance.invokeHook(LifecycleHook.mounted)
    runtimeInstance.invokeHook(LifecycleHook.activated)
  }
  /** @inheritDoc */
  override activate(node: StatefulWidgetNode, root: boolean): void {
    const widget = node.instance!
    super.activate(node, root)
    widget.scope.resume()
    widget.invokeHook(LifecycleHook.activated)
    if (widget.dirty) {
      widget.update()
      flushSync()
    }
  }
  /** @inheritDoc */
  override deactivate(node: StatefulWidgetNode, root: boolean): void {
    const widget = node.instance!
    // 先调用根节点的停用逻辑（子 → 父顺序）
    super.deactivate(node, root)
    widget.scope.pause()
    widget.invokeHook(LifecycleHook.deactivated)
  }
  /** @inheritDoc */
  override unmount(node: StatefulWidgetNode): void {
    const instance = node.instance
    if (!instance) return
    if (node.state !== NodeState.Deactivated) {
      // 修改状态为已停用
      node.state = NodeState.Deactivated
      // 触发onDeactivated生命周期
      instance.invokeHook(LifecycleHook.deactivated)
    }
    // 触发onBeforeUnmount生命周期
    instance.invokeHook(LifecycleHook.beforeUnmount)
    instance.invokeHook(LifecycleHook.destroy)
    super.unmount(node)
    // 触发onUnmounted生命周期
    instance.invokeHook(LifecycleHook.unmounted)
  }
}
