import { Scheduler, SubManager } from '@vitarx/responsive'
import { LifecycleHooks, NodeState } from '../constants/index.js'
import type {
  AnyProps,
  HostNodeElements,
  OpsType,
  StatefulWidgetVNode,
  StatefulWidgetVNodeType,
  VNode
} from '../types/index.js'
import { isVNode } from '../utils/index.js'
import { createCommentVNode, renderNode } from '../vnode/index.js'
import { createWidgetRuntime } from '../widget/runtime/utils.js'
import { BaseWidgetController } from './BaseWidgetController.js'

/**
 * StatefulWidgetController 是用于管理有状态组件(StatefulWidget)生命周期的控制器类。
 * 它继承自 BaseWidgetController，负责处理有状态组件的属性更新、渲染、挂载、激活、停用和卸载等核心操作。
 *
 * 核心功能：
 * - 属性更新管理：处理组件属性的变化并触发相应的更新
 * - 渲染控制：管理组件的渲染过程，包括错误处理
 * - 生命周期管理：控制组件的挂载、激活、停用和卸载等生命周期状态
 *
 * 构造函数参数：
 * - 无特定构造函数参数，继承自 BaseWidgetController
 *
 * 使用示例：
 * ```typescript
 * const controller = new StatefulWidgetController();
 * // 在框架内部使用，通常不需要直接实例化
 * ```
 *
 * 特殊说明：
 * - 该类通常由框架内部使用，开发者一般不需要直接操作
 * - 组件的生命周期钩子会按照特定顺序触发
 * - 错误处理机制会在渲染失败时自动创建错误节点
 */
export class StatefulWidgetController extends BaseWidgetController<StatefulWidgetVNodeType> {
  /** @inheritDoc */
  override updateProps(node: StatefulWidgetVNode, newProps: AnyProps): void {
    const oldProps = node.props
    const changedKeys: string[] = this.diffProps(oldProps, newProps)
    // 如果有属性变化，触发更新
    if (changedKeys.length > 0) {
      SubManager.notify(node.runtimeInstance!.props, changedKeys)
      node.runtimeInstance!.update()
      // 同步执行所有队列中的任务
      Scheduler.flushSync()
    }
  }
  /** @inheritDoc */
  override render(node: VNode<StatefulWidgetVNodeType>): HostNodeElements {
    const widget = createWidgetRuntime(node)
    // 触发render生命周期钩子
    widget.callHook(LifecycleHooks.render)
    let el: HostNodeElements
    try {
      el = super.render(node)
    } catch (e) {
      const errVNode = widget.reportError(e, 'render')
      widget.cachedChildVNode = isVNode(errVNode)
        ? errVNode
        : createCommentVNode({ value: `StatefulWidget<${widget.name}> render fail` })
      // 获取更新后的DOM元素
      el = renderNode(widget.cachedChildVNode)
    }
    // 绑定 ref 引用
    if (node.ref) node.ref.value = widget.instance
    return el
  }
  /** @inheritDoc */
  override mount(node: StatefulWidgetVNode, target?: HostNodeElements, opsType?: OpsType): void {
    const widget = node.runtimeInstance!
    widget.callHook(LifecycleHooks.beforeMount)
    super.mount(node, target, opsType)
    node.state = NodeState.Activated
    widget.callHook(LifecycleHooks.mounted)
    widget.callHook(LifecycleHooks.activated)
  }
  /** @inheritDoc */
  override activate(node: StatefulWidgetVNode, root: boolean): void {
    const widget = node.runtimeInstance!
    super.activate(node, root)
    widget.scope.resume()
    widget.callHook(LifecycleHooks.activated)
    if (widget.dirty) {
      widget.update()
      Scheduler.flushSync()
    }
  }
  /** @inheritDoc */
  override deactivate(node: StatefulWidgetVNode, root: boolean): void {
    const widget = node.runtimeInstance!
    // 先调用根节点的停用逻辑（子 → 父顺序）
    super.deactivate(node, root)
    widget.scope.pause()
    widget.callHook(LifecycleHooks.deactivated)
  }
  /** @inheritDoc */
  override unmount(node: StatefulWidgetVNode): void {
    const widget = node.runtimeInstance!
    if (node.state !== NodeState.Deactivated) {
      // 修改状态为已停用
      node.state = NodeState.Deactivated
      // 触发onDeactivated生命周期
      widget.callHook(LifecycleHooks.deactivated)
    }
    // 触发onBeforeUnmount生命周期
    widget.callHook(LifecycleHooks.beforeUnmount)
    super.unmount(node)
    // 触发onUnmounted生命周期
    widget.callHook(LifecycleHooks.unmounted)
  }
}
