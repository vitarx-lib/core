import { unref } from '@vitarx/responsive'
import { isRecordObject, logger } from '@vitarx/utils'
import { NodeKind } from '../../constants/index.js'
import { getAppContext } from '../../runtime/index.js'
import type {
  NodeDevInfo,
  StatefulWidgetNode,
  StatelessWidgetNode,
  VNodeInputProps,
  VNodeOf,
  WidgetTypes
} from '../../types/index.js'
import { __DEV__, getWidgetName, isStatelessWidget } from '../../utils/index.js'
import { createBaseVNode } from './base.js'

/**
 * 校验组件属性，确保传入的属性符合组件定义的约束条件
 *
 * 此函数会在开发环境下执行，用于检查组件的属性是否有效。如果组件定义了validateProps方法，
 * 则会调用该方法进行校验，并根据校验结果输出相应的警告或错误信息。
 *
 * @param widget - 组件类型，可能包含validateProps方法
 * @param props - 组件属性对象，需要被校验的属性
 * @param devInfo - 开发信息，可选参数，包含源码位置等调试信息
 * @returns {string|void} 如果校验失败，返回错误信息；否则返回undefined
 *
 * @example
 * ```typescript
 * // 组件定义
 * class MyWidget {
 *   static validateProps(props) {
 *     if (props.value < 0) {
 *       return 'Value must be positive';
 *     }
 *     return true;
 *   }
 * }
 *
 * // 使用校验函数
 * const result = validateProps(MyWidget, { value: -1 }, { source: 'App.js:10' });
 * // 控制台将输出警告: "Widget <MyWidget>: Value must be positive"
 * ```
 */
function validateProps<T extends WidgetTypes>(
  widget: T,
  props: VNodeInputProps<T>,
  devInfo?: NodeDevInfo
): void {
  // 在开发环境下，如果组件提供了validateProps方法，则执行属性校验
  if (__DEV__ && typeof widget.validateProps === 'function') {
    // 获取组件名称
    const name = getWidgetName(widget)
    const p: Record<string, any> = {}
    for (const [key, value] of Object.entries(props)) {
      p[key] = unref(value)
    }
    // 执行组件的属性校验方法
    const result = widget.validateProps(p)
    // 校验失败处理
    if (result === false) {
      // 记录错误日志，包含源信息
      logger.error(`Widget <${name}> props validation failed.`, devInfo?.source)
    } else if (typeof result === 'string') {
      // 如果返回的是字符串，则记录警告日志
      logger.warn(`Widget <${name}>: ${result}`, devInfo?.source)
    }
  }
}

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
export function createWidgetVNode<T extends WidgetTypes>(
  widget: T,
  props: VNodeInputProps<T>
): VNodeOf<T> {
  // 判断组件是否为无状态组件
  if (isRecordObject(widget.defaultProps)) {
    props = { ...widget.defaultProps, ...props }
  }
  // 创建基础虚拟节点，根据组件类型设置不同的节点类型
  const node = createBaseVNode(
    widget,
    isStatelessWidget(widget) ? NodeKind.STATELESS_WIDGET : NodeKind.STATEFUL_WIDGET,
    props
  ) as StatefulWidgetNode | StatelessWidgetNode
  node.appContext = getAppContext()
  // 开发模式下执行属性校验
  if (__DEV__) validateProps(widget, props, node.devInfo)
  // 返回创建的节点
  return node as VNodeOf<T>
}
