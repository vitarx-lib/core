import type { Directive } from '../directive.js'
import type { StatefulWidgetVNodeType } from '../vnode.js'
import type { WidgetVNode } from './BaseNode.js'

/**
 * 有状态组件节点接口
 *
 * 表示具有内部状态的自定义组件节点。有状态组件可以维护自己的状态，
 * 并在状态变化时重新渲染。这些组件通常包含用户交互、数据获取等
 * 需要内部状态管理的功能。
 *
 * 与StatefulWidgetVNode不同，StatefulWidgetVNode会维护一个组件实例(instance)，
 * 该实例在组件生命周期内保持不变，用于存储组件的状态和生命周期方法。
 *
 * @template T 组件节点类型，默认为StatefulWidgetVNodeType
 */
export interface StatefulWidgetVNode<T extends StatefulWidgetVNodeType = StatefulWidgetVNodeType>
  extends WidgetVNode<T> {
  /**
   * 是否是异步组件
   *
   * 此属性仅在组件实例解析后存在
   */
  isAsyncWidget?: boolean
  /**
   * 组件作用域指令缓存
   */
  directiveStore?: Map<string, Directive>
  /**
   * 组件注入缓存
   */
  injectionStore?: Map<string | symbol, any>
}
