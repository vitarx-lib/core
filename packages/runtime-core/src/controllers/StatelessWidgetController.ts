import type {
  AnyProps,
  NodeElementType,
  StatelessWidgetVNode,
  StatelessWidgetVNodeType,
  WidgetVNode
} from '../types/index.js'
import { BaseWidgetController } from './BaseWidgetController.js'

/**
 * StatelessWidgetController 是一个用于管理无状态组件（StatelessWidget）行为的控制器类。
 * 它继承自 BaseWidgetController，专门处理 StatelessWidgetVNode 类型的节点。
 *
 * 核心功能：
 * - 监控和更新无状态组件的属性变化
 * - 当属性发生变化时，触发组件的更新
 *
 * 使用示例：
 * ```typescript
 * const controller = new StatelessWidgetController();
 * controller.updateProps(node, newProps);
 * ```
 *
 * 构造函数参数：
 * - 无特殊参数，使用默认构造函数
 *
 * 特殊说明：
 * - 该控制器仅用于无状态组件，不维护组件状态
 * - 属性更新会触发组件的重新渲染，但不会保留任何状态信息
 */
export class StatelessWidgetController extends BaseWidgetController<StatelessWidgetVNodeType> {
  override render(
    node: WidgetVNode<StatelessWidgetVNodeType>
  ): NodeElementType<StatelessWidgetVNodeType> {
    const el = super.render(node)
    if (node.ref) node.ref.value = node
    return el
  }
  /**
   * @inheritDoc
   */
  override updateProps(node: StatelessWidgetVNode, newProps: AnyProps): void {
    const oldProps = node.props // 保存节点的旧属性
    const change = this.diffProps(oldProps, newProps)
    // 如果有属性值发生变化，则更新节点的运行时实例
    if (change.length) node.runtimeInstance!.update()
  }
}
