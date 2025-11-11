import { validateProps } from '../../runtime/index.js'
import type { ValidNodeProps, VNodeInstanceType, WidgetType } from '../../types/index.js'
import { __DEV__, getNodeDevInfo } from '../../utils/index.js'
import { isStatelessWidget } from '../../utils/widget.js'
import { CommentNode } from '../nodes/CommentNode.js'
import { StatefulWidgetNode } from '../nodes/StatefulWidgetNode.js'
import { StatelessWidgetNode } from '../nodes/StatelessWidgetNode.js'

/**
 * 创建 Widget 节点（Stateless / Stateful）
 */
export function createWidgetVNode<T extends WidgetType>(
  widget: T,
  props: ValidNodeProps<T>
): VNodeInstanceType<T> {
  if (__DEV__) {
    const devInfo = getNodeDevInfo(props)
    const message = validateProps(widget, props, devInfo)
    if (message) {
      return new CommentNode({ value: message }) as unknown as VNodeInstanceType<T>
    }
  }
  return (isStatelessWidget(widget)
    ? new StatelessWidgetNode(widget, props)
    : new StatefulWidgetNode(widget, props)) as unknown as VNodeInstanceType<T>
}
