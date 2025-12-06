import {
  activateNode,
  type AnyProps,
  createWidgetRuntime,
  deactivateNode,
  type ElementOf,
  type HostElements,
  type HostNodeElements,
  invokeDirHook,
  isElementNode,
  mountNode,
  type NodeDriver,
  NodeState,
  type OpsType,
  renderNode,
  unmountNode,
  type WidgetNode,
  type WidgetTypes
} from '@vitarx/runtime-core'
import { isDeepEqual } from '@vitarx/utils'

/**
 * 基础 Widget 驱动抽象类，实现了 NodeDriver 接口。
 * 提供了 Widget 节点的生命周期管理和基本操作方法。
 *
 * 核心功能：
 * - Widget 节点的渲染、挂载、激活、停用和卸载
 * - 处理指令钩子的调用
 * - 管理 Widget 节点的状态转换
 *
 * 使用示例：
 * ```typescript
 * class MyWidgetDriver extends BaseWidgetDriver<WidgetType.Button> {
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
export abstract class BaseWidgetDriver<T extends WidgetTypes> implements NodeDriver<T> {
  /** @inheritDoc */
  abstract updateProps(node: WidgetNode<T>, newProps: AnyProps): void

  /** @inheritDoc */
  render(node: WidgetNode<T>): ElementOf<T> {
    const widget = createWidgetRuntime(node)
    // 从根节点获取元素并转换为宿主元素实例类型
    const el = renderNode(widget.child)
    node.state = NodeState.Rendered
    // 调用指令钩子
    invokeDirHook(node, 'created')
    return el as ElementOf<T>
  }

  /** @inheritDoc */
  mount(node: WidgetNode<T>, target?: HostNodeElements, opsType?: OpsType): void {
    invokeDirHook(node, 'beforeMount')
    mountNode(node.instance!.child, target, opsType)
    node.state = NodeState.Activated
    invokeDirHook(node, 'mounted')
  }

  /** @inheritDoc */
  activate(node: WidgetNode<T>, root: boolean = true): void {
    activateNode(node.instance!.child, root)
    node.state = NodeState.Activated
  }

  /** @inheritDoc */
  deactivate(node: WidgetNode<T>, root: boolean = true): void {
    deactivateNode(node.instance!.child, root)
    node.state = NodeState.Deactivated
  }

  /** @inheritDoc */
  unmount(node: WidgetNode<T>): void {
    if (!node.instance) return
    const isElement = isElementNode(node.instance!.child)
    const el = node.el! as HostElements
    if (isElement) invokeDirHook(node, 'beforeUnmount')
    unmountNode(node.instance!.child)
    node.instance!.destroy()
    if (node.ref) node.ref.value = null
    node.state = NodeState.Unmounted
    if (isElement) invokeDirHook(node, 'unmounted', el)
  }

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
      const oldValue = oldProps[key]
      const newValue = newProps[key]
      if (oldProps[key] !== newProps[key] || !isDeepEqual(oldValue, newValue, 1)) {
        oldProps[key] = newProps[key]
        changedKeys.push(key)
      }
    }
    return changedKeys
  }
}
