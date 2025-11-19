import { isRecordObject } from '@vitarx/utils'
import { NodeKind } from '../constants/index.js'
import { __DEV__ } from '../internal/dev.js'
import { getAppContext, validateProps } from '../runtime/index.js'
import type {
  StatefulWidget,
  StatefulWidgetVNode,
  StatelessWidget,
  StatelessWidgetVNode,
  ValidNodeProps,
  WidgetType
} from '../types/index.js'
import { isStatelessWidget } from '../utils/index.js'
import { createBaseVNode } from './baseCreateor.js'

/**
 * 为无状态组件创建虚拟节点
 *
 * 此函数重载用于处理无状态组件的虚拟节点创建，返回特定类型的节点对象。
 *
 * @param widget - 无状态组件类型
 * @param props - 组件的有效属性
 * @returns 创建的无状态组件虚拟节点
 *
 * @example
 * ```tsx
 * const MyStatelessWidget = defineStatelessWidget(({text}:{text:string}) => {
 *   return <div> {text} </div>;
 * });
 *
 * const node = createWidgetNode(MyStatelessWidget, { text: 'Hello' });
 * // node 是 StatelessWidgetNode 类型
 * ```
 */
export function createWidgetNode<T extends StatelessWidget>(
  widget: T,
  props: ValidNodeProps<T>
): StatelessWidgetVNode

/**
 * 为有状态组件创建虚拟节点
 *
 * 此函数重载用于处理有状态组件的虚拟节点创建，返回特定类型的节点对象。
 *
 * @param widget - 有状态组件类型
 * @param props - 组件的有效属性
 * @returns 创建的有状态组件虚拟节点
 *
 * @example
 * ```typescript
 * class MyStatefulWidget extends Widget {
 *   build() {
 *     return h('div', { children: this.props.text });
 *   }
 * }
 *
 * const node = createWidgetNode(MyStatefulWidget, { text: 'Hello' });
 * // node 是 StatefulWidgetNode 类型
 * ```
 */
export function createWidgetNode<T extends StatefulWidget>(
  widget: T,
  props: ValidNodeProps<T>
): StatefulWidgetVNode

/**
 * 为组件创建虚拟节点
 *
 * 这是核心的组件节点创建函数，根据组件类型自动判断是无状态组件还是有状态组件，
 * 并创建相应类型的虚拟节点。在开发环境下会自动执行属性校验。
 *
 * @param widget - 组件类型，可以是无状态组件或有状态组件
 * @param props - 组件的有效属性
 * @returns 根据组件类型返回相应的虚拟节点对象
 *
 * @example
 * ```typescript
 * // 无状态组件示例
 * const StatelessComponent = defineStatelessWidget((props) => h('div', props.text));
 *
 * // 有状态组件示例
 * class StatefulComponent {
 *   constructor(props) {
 *     this.props = props;
 *   }
 *
 *   render() {
 *     return h('div', this.props.text);
 *   }
 * }
 *
 * // 创建无状态组件节点
 * const statelessNode = createWidgetNode(StatelessComponent, { text: 'Hello' });
 *
 * // 创建有状态组件节点
 * const statefulNode = createWidgetNode(StatefulComponent, { text: 'Hello' });
 * ```
 */
export function createWidgetNode<T extends WidgetType>(
  widget: T,
  props: ValidNodeProps<T>
): StatelessWidgetVNode | StatefulWidgetVNode {
  // 判断组件是否为无状态组件
  const isStateless = isStatelessWidget(widget)
  if (isStateless && isRecordObject(widget.defaultProps)) {
    props = { ...widget.defaultProps, ...props }
  }
  // 创建基础虚拟节点，根据组件类型设置不同的节点类型
  const node = createBaseVNode(
    widget,
    isStateless ? NodeKind.STATELESS_WIDGET : NodeKind.STATEFUL_WIDGET,
    props,
    // 对于无状态组件，需要解除属性的响应式引用
    !!isStateless
  ) as StatefulWidgetVNode | StatelessWidgetVNode
  node.appContext = getAppContext()
  // 开发模式下执行属性校验
  if (__DEV__) validateProps(widget, props, node.devInfo)
  // 返回创建的节点
  return node
}
