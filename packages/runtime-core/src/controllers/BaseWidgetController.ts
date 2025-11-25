import { NodeState } from '../constants/index.js'
import { callDirHook } from '../directive/index.js'
import type {
  AnyProps,
  HostElements,
  HostNodeElements,
  NodeController,
  NodeElementType,
  OpsType,
  WidgetTypes,
  WidgetVNode
} from '../types/index.js'
import { isElementNode } from '../utils/index.js'
import { activateNode, deactivateNode, mountNode, renderNode, unmountNode } from '../vnode/index.js'
import { createWidgetRuntime } from '../widget/runtime/utils.js'

/**
 * 基础 Widget 控制器抽象类，实现了 NodeController 接口。
 * 提供了 Widget 节点的生命周期管理和基本操作方法。
 *
 * 核心功能：
 * - Widget 节点的渲染、挂载、激活、停用和卸载
 * - 处理指令钩子的调用
 * - 管理 Widget 节点的状态转换
 *
 * 使用示例：
 * ```typescript
 * class MyWidgetController extends BaseWidgetController<WidgetType.Button> {
 *   updateProps(node: WidgetVNode<WidgetType.Button>, newProps: AnyProps) {
 *     // 实现属性更新逻辑
 *   }
 * }
 * ```
 *
 * 构造函数参数：
 * - 无直接构造函数参数，通过泛型 T 指定 Widget 类型
 *
 * 使用限制：
 * - 这是一个抽象类，必须通过继承来实现具体功能
 * - 子类必须实现 updateProps 方法
 *
 * 特殊说明：
 * - 该类会自动管理节点的状态转换
 * - 对于元素节点，会在适当的生命周期节点调用指令钩子
 * - 使用了泛型约束 T extends WidgetTypes 来确保类型安全
 */
export abstract class BaseWidgetController<T extends WidgetTypes> implements NodeController<T> {
  /** @inheritDoc */
  abstract updateProps(node: WidgetVNode<T>, newProps: AnyProps): void
  /**
   * 比较新旧属性对象的差异，并更新旧属性对象以匹配新属性对象
   * @param oldProps 旧的属性对象
   * @param newProps 新的属性对象
   * @return 发生变化的属性键名数组
   */
  protected diffProps(oldProps: AnyProps, newProps: AnyProps): string[] {
    const changedKeys: string[] = [] // 用于存储发生变化的属性键名

    // 删除不存在于 newProps 中的属性
    for (const key in oldProps) {
      if (!(key in newProps)) {
        delete oldProps[key]
        changedKeys.push(key)
      }
    }

    // 新增或更新存在于 newProps 中的属性
    for (const key in newProps) {
      if (oldProps[key] !== newProps[key]) {
        oldProps[key] = newProps[key]
        changedKeys.push(key)
      }
    }
    return changedKeys
  }
  /** @inheritDoc */
  render(node: WidgetVNode<T>): NodeElementType<T> {
    const widget = createWidgetRuntime(node)
    // 从根节点获取元素并转换为宿主元素实例类型
    const el = renderNode(widget.child)
    node.state = NodeState.Rendered
    // 如果是元素节点，则调用指令钩子
    if (isElementNode(node.runtimeInstance!.child)) callDirHook(node, 'created')
    return el as NodeElementType<T>
  }
  /** @inheritDoc */
  mount(node: WidgetVNode<T>, target?: HostNodeElements, opsType?: OpsType): void {
    const isElement = isElementNode(node.runtimeInstance!.child)
    if (isElement) callDirHook(node, 'beforeMount')
    mountNode(node.runtimeInstance!.child, target, opsType)
    node.state = NodeState.Activated
    if (isElement) callDirHook(node, 'mounted')
  }
  /** @inheritDoc */
  activate(node: WidgetVNode<T>, root: boolean = true): void {
    activateNode(node.runtimeInstance!.child, root)
    node.state = NodeState.Activated
  }
  /** @inheritDoc */
  deactivate(node: WidgetVNode<T>, root: boolean = true): void {
    deactivateNode(node.runtimeInstance!.child, root)
    node.state = NodeState.Deactivated
  }
  /** @inheritDoc */
  unmount(node: WidgetVNode<T>): void {
    const isElement = isElementNode(node.runtimeInstance!.child)
    const el = node.el! as HostElements
    if (isElement) callDirHook(node, 'beforeUnmount')
    unmountNode(node.runtimeInstance!.child)
    node.runtimeInstance!.destroy()
    if (node.ref) node.ref.value = null
    node.state = NodeState.Unmounted
    if (isElement) callDirHook(node, 'unmounted', el)
  }
}
