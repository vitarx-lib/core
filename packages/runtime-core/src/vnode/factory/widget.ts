import { logger } from '@vitarx/utils'
import type { ValidNodeProps, VNodeInstanceType, WidgetType } from '../../types/index.js'
import { __DEV__, getNodeDevInfo } from '../../utils/index.js'
import { getWidgetName, isStatelessWidget } from '../../utils/widget.js'
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
  if (__DEV__ && typeof widget.validateProps === 'function') {
    const name = getWidgetName(widget)
    const devInfo = getNodeDevInfo(props)
    const result = widget.validateProps(props)

    // 校验失败处理
    if (result === false) {
      const message = `Widget <${name}> props validation failed.`
      logger.error(message, devInfo?.source)
      return new CommentNode({ value: message }) as unknown as VNodeInstanceType<T>
    } else if (typeof result === 'string') {
      logger.warn(`Widget <${name}>: ${result}`, devInfo?.source)
    }
  }

  return (isStatelessWidget(widget)
    ? new StatelessWidgetNode(widget, props)
    : new StatefulWidgetNode(widget, props)) as unknown as VNodeInstanceType<T>
}
