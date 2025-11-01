import type {
  AnyProps,
  HostElementInstance,
  HostParentElement,
  MountType,
  NodeNormalizedProps,
  SimpleWidget
} from '../../types/index.js'
import { VNode, WidgetNode } from '../base/index.js'
import { NodeShapeFlags, NodeState } from '../constants/index.js'
import { isVNode } from '../utils/index.js'
import { unwrapRefProps } from '../utils/unwrapRefProps.js'
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
export class StatelessWidgetNode<T extends SimpleWidget = SimpleWidget> extends WidgetNode<T> {
  public override shapeFlags = NodeShapeFlags.STATELESS_WIDGET
  /**
   * @inheritDoc
   */
  override get element(): HostElementInstance<T> {
    if (this.state === NodeState.Created) {
      this.state = NodeState.Rendered
    }
    // 从根节点获取元素并转换为宿主元素实例类型
    return this.rootNode.element as HostElementInstance<T>
  }
  /**
   * @inheritDoc
   */
  override mount(target?: HostParentElement, type?: MountType): void {
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
    this.rootNode.activate(false)
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Activated) return
    this.rootNode.deactivate(false)
    // 1️⃣ 更新挂载状态（先移除 DOM）
    this.updateActiveState(false, root)
  }
  /**
   * @inheritDoc
   */
  override unmount(root: boolean = true): void {
    // 递归卸载子节点
    this.rootNode.unmount(root)
    this._rootNode = null
    this.state = NodeState.Unmounted
  }

  /**
   * 构建组件方法
   * 根据组件类型和属性生成对应的虚拟DOM节点
   * @returns {VNode | TextNode | CommentNode} 返回构建的虚拟DOM节点
   */
  protected override rebuild(): VNode {
    // 调用组件类型方法并传入props，获取构建结果
    // 如果构建结果是字符串或数字，创建文本节点并返回
    const buildResult = this.type.call(null, this.props)
    // 如果构建结果是VNode节点，直接返回
    if (isVNode(buildResult)) return buildResult
    // 获取构建结果的类型
    const t = typeof buildResult
    // 如果构建结果是函数，抛出错误
    if (t === 'function') throw new Error(`SimpleWidget(${this.name}) cannot return a function`)
    if (t === 'string' || t === 'number') return new TextNode({ value: String(buildResult) })
    // 如果构建结果不是VNode，则创建错误注释节点
    return new CommentNode({ value: `SimpleWidget(${this.name}) build ${String(t)}` })
  }

  /**
   * @inheritDoc
   */
  protected override normalizeProps(props: AnyProps): NodeNormalizedProps<T> {
    return unwrapRefProps(props) as NodeNormalizedProps<T>
  }
}
