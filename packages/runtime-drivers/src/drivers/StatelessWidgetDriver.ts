import type {
  AnyProps,
  NodeElementType,
  StatelessWidgetVNode,
  StatelessWidgetVNodeType,
  WidgetVNode
} from '@vitarx/runtime-core'
import { BaseWidgetDriver } from './BaseWidgetDriver.js'

/**
 * StatelessWidgetDriver 是一个用于管理无状态组件（StatelessWidget）行为的驱动器类。
 * 它继承自 BaseWidgetDriver，专门处理 StatelessWidgetVNode 类型的节点。
 *
 * 核心功能：
 * - 监控和更新无状态组件的属性变化
 * - 当属性发生变化时，触发组件的更新
 *
 * 使用示例：
 * ```typescript
 * const controller = new StatelessWidgetDriver();
 * controller.updateProps(node, newProps);
 * ```
 *
 * 构造函数参数：
 * - 无特殊参数，使用默认构造函数
 *
 * 特殊说明：
 * - 该驱动器仅用于无状态组件，不维护组件状态
 * - 属性更新会触发组件的重新渲染，但不会保留任何状态信息
 */
export class StatelessWidgetDriver extends BaseWidgetDriver<StatelessWidgetVNodeType> {
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
