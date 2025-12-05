import type { StatelessWidgetNodeType } from '../vnode.js'
import type { WidgetNode } from './VNode.js'

/**
 * 无状态组件节点接口
 *
 * 表示没有内部状态的自定义组件节点。无状态组件的输出完全由其输入属性决定，
 * 相同的输入总是产生相同的输出。这些组件通常用于展示性内容，
 * 如按钮、标签、卡片等。
 *
 * @template T 组件节点类型，默认为StatelessWidgetNodeType
 */
export interface StatelessWidgetNode<T extends StatelessWidgetNodeType = StatelessWidgetNodeType>
  extends WidgetNode<T> {}
