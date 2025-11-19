import type { StatelessWidgetVNodeType } from '../vnode.js'
import type { WidgetVNode } from './BaseNode.js'

/**
 * 无状态组件节点接口
 *
 * 表示没有内部状态的自定义组件节点。无状态组件的输出完全由其输入属性决定，
 * 相同的输入总是产生相同的输出。这些组件通常用于展示性内容，
 * 如按钮、标签、卡片等。
 *
 * 与StatefulWidgetVNode不同，StatelessWidgetVNode不维护组件实例，
 * 每次渲染都会重新创建组件实例，因此更加轻量级。
 * 无状态组件是纯函数式的，没有副作用，便于测试和优化。
 *
 * @template T 组件节点类型，默认为StatelessWidgetVNodeType
 */
export interface StatelessWidgetVNode<T extends StatelessWidgetVNodeType = StatelessWidgetVNodeType>
  extends WidgetVNode<T> {}
