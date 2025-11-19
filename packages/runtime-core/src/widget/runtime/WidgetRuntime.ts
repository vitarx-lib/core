import { runInNodeContext } from '../../runtime/index.js'
import type { VNode, WidgetVNode, WidgetVNodeType } from '../../types/index.js'

/**
 * Widget组件运行时基类，提供组件生命周期管理和虚拟节点构建功能。
 *
 * 核心功能：
 * - 管理组件的虚拟节点构建和更新
 * - 提供组件实例的生命周期管理
 * - 处理组件属性的访问和管理
 * - 维护子虚拟节点的缓存
 *
 * @example
 * class MyWidgetRuntime extends WidgetRuntime<MyWidget> {
 *   public build(): VNode {
 *     // 实现构建逻辑
 *   }
 *
 *   public update(): void {
 *     // 实现更新逻辑
 *   }
 * }
 *
 * @constructor
 * @param {WidgetVNode} node - 组件的虚拟节点实例，包含组件类型和属性信息
 *
 * 注意事项：
 * - 这是一个抽象类，必须通过继承实现
 * - 子类必须实现build()和update()方法
 * - 组件销毁时需要调用destroy()方法释放资源
 * - 组件属性(props)是只读的，修改需要通过update()方法
 */
export abstract class WidgetRuntime<W extends WidgetVNodeType> {
  /** 组件名称，用于调试和错误追踪 */
  public readonly name: string
  /** 组件属性（只读） */
  public props: Readonly<Record<string, any>>
  /** 缓存的子虚拟节点 */
  cachedChildVNode: VNode | null = null
  constructor(public node: WidgetVNode<W>) {
    node.runtimeInstance = this as unknown as WidgetVNode<W>['runtimeInstance']
    this.name = node.type.displayName || node.type.name || 'anonymous'
    this.props = node.props
    // 关联子节点的 el 和 anchor 属性
    Object.defineProperty(node, 'el', {
      get() {
        return this.runtimeInstance?.child.el
      },
      configurable: true,
      enumerable: true,
      writable: true
    })
    Object.defineProperty(node, 'anchor', {
      get() {
        return this.runtimeInstance?.child.anchor
      },
      configurable: true,
      enumerable: true,
      writable: true
    })
  }
  /** 获取子虚拟节点（懒构建） */
  get child(): VNode {
    if (!this.cachedChildVNode) {
      return (this.cachedChildVNode = this.build())
    }
    return this.cachedChildVNode
  }
  get type(): W {
    return this.node.type
  }
  /**
   * 销毁实例资源
   * 执行清理操作，释放内存
   */
  public destroy(): void {
    // 清空缓存的子虚拟节点
    this.cachedChildVNode = null
    delete this.node.el
    delete this.node.anchor
  }
  /**
   * 构建子虚拟节点
   *
   * 调用组件实例的 build 方法生成虚拟节点，并处理各种返回值类型：
   * - VNode: 直接使用
   * - string/number: 转换为文本节点
   * - 其他类型: 创建注释节点（开发模式警告）
   *
   * @returns 构建的虚拟节点
   */
  public abstract build(): VNode
  /**
   * 更新组件
   */
  public abstract update(): void
  /**
   * 在组件上下文中执行函数
   *
   * 确保函数在正确的应用上下文和节点上下文中执行
   *
   * @template R - 函数返回值类型
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   */
  public runInContext<R>(fn: () => R): R {
    if (this.node.appContext) {
      return this.node.appContext.runInContext(() => runInNodeContext(this.node, fn))
    }
    return runInNodeContext(this.node, fn)
  }
}
