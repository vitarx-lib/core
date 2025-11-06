import { logger } from '@vitarx/utils'
import type {
  HostElement,
  HostParentElement,
  MountType,
  NodeElementType,
  NodeNormalizedProps,
  StatelessWidgetNodeType,
  ValidNodeProps
} from '../../types/index.js'
import { VNode, type WaitNormalizedProps, WidgetNode } from '../base/index.js'
import { NodeShapeFlags, NodeState } from '../constants/index.js'
import { linkParentNode, VNodeUpdate } from '../runtime/index.js'
import { unwrapRefProps } from '../runtime/internal/normalize.js'
import { isVNode } from '../utils/index.js'
import { CommentNode } from './CommentNode.js'
import { TextNode } from './TextNode.js'

/**
 * StatelessWidgetNode 是无状态组件的节点实现类，继承自 WidgetNode。
 * 它负责管理无状态组件的生命周期，包括组件的挂载、激活、卸载等操作。
 *
 * 核心功能：
 * - 组件的挂载和卸载管理
 * - 组件的激活和停用控制
 * - 组件的构建和更新
 * - 属性的规范化处理
 *
 * @template T - 继承自 SimpleWidget 的组件类型
 */
export class StatelessWidgetNode<
  T extends StatelessWidgetNodeType = StatelessWidgetNodeType
> extends WidgetNode<T> {
  constructor(type: T, props: ValidNodeProps<T>) {
    super(type, props)
    if (this.ref) {
      logger.warn(
        `StatelessWidget(${this.name}) not supported ref attributes`,
        this.devInfo?.source
      )
    }
  }
  public override shapeFlags = NodeShapeFlags.STATELESS_WIDGET
  /**
   * 重写渲染方法，返回根元素实例
   * @returns HostElementInstance<T> 根宿主元素实例
   */
  override render(): NodeElementType<T> {
    if (this.state === NodeState.Created) {
      this.state = NodeState.Rendered // 将节点状态从已创建更新为已渲染
    }
    // 从根节点获取元素并转换为宿主元素实例类型
    return this.child.element as NodeElementType<T>
  }

  /**
   * @inheritDoc
   */
  override mount(target?: HostElement | HostParentElement, type?: MountType): void {
    if (this.state === NodeState.Created) this.element
    super.mount(target, type)
  }
  /**
   * @inheritDoc
   */
  override activate(root: boolean): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Deactivated) return
    // 1️⃣ 先调用父节点自己的激活逻辑
    this.updateActiveState(true, root)
    // 2️⃣ 再激活子节点（父 → 子顺序）
    this.child.activate(false)
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Activated) return
    this.child.deactivate(false)
    // 1️⃣ 更新挂载状态（先移除 DOM）
    this.updateActiveState(false, root)
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    // 递归卸载子节点
    this.child.unmount(root)
    this._child = null
    this.state = NodeState.Unmounted
  }

  /**
   * 构建组件方法
   * 根据组件类型和属性生成对应的虚拟DOM节点
   * @returns {VNode | TextNode | CommentNode} 返回构建的虚拟DOM节点
   */
  protected override rebuild(): VNode {
    const node = this.buildRootNode()
    linkParentNode(node, this)
    return node
  }
  /**
   * 构建根节点的方法
   * 根据组件类型和属性创建相应的虚拟DOM节点
   * @returns {VNode | TextNode | CommentNode} 返回构建的节点对象
   */
  private buildRootNode(): VNode {
    // 调用组件类型方法并传入props，获取构建结果
    // 如果构建结果是字符串或数字，创建文本节点并返回
    const buildResult = this.appContext
      ? this.appContext.runInContext(() => this.type.call(null, this.props)) // 如果有应用上下文，则在上下文中运行组件类型方法
      : () => this.type.call(null, this.props) // 否则直接调用组件类型方法
    // 如果构建结果是VNode节点，直接返回
    if (isVNode(buildResult)) return buildResult
    // 获取构建结果的类型
    const t = typeof buildResult
    // 如果构建结果是函数，抛出错误
    if (t === 'function') throw new Error(`StatelessWidget<${this.name}> cannot return a function`)
    // 如果构建结果是字符串或数字，创建并返回文本节点
    if (t === 'string' || t === 'number') return new TextNode({ value: String(buildResult) })
    // 如果构建结果不是VNode，则创建错误注释节点，记录构建结果的类型
    return new CommentNode({ value: `StatelessWidget<${this.name}> build ${String(t)}` })
  }
  /**
   * 更新组件属性的方法
   *
   * @param newProps - 新的规范化属性对象，类型为NodeNormalizedProps<T>
   */
  public updateProps(newProps: NodeNormalizedProps<T>) {
    // 将传入的新属性赋值给当前实例的props属性
    this.props = newProps
    // 重新构建节点，生成新的虚拟DOM节点
    const newNode = this.rebuild()
    // 如果节点不显示，则同步给新的节点
    if (!newNode.show) newNode.show = false
    // 使用patchUpdate方法对比并更新实际的DOM节点
    // 将当前根节点与新构建的节点进行差异更新，并将结果赋值给_rootNode
    this._child = VNodeUpdate.patch(this.child, newNode)
  }

  /**
   * @inheritDoc
   */
  protected override normalizeProps(props: WaitNormalizedProps<T>): NodeNormalizedProps<T> {
    const defaultProps = this.type.defaultProps
    if (defaultProps && typeof defaultProps === 'object') {
      props = { ...defaultProps, ...props }
    }
    return unwrapRefProps(props) as NodeNormalizedProps<T>
  }
}
