import {
  NodeKind,
  type RegularElementNode,
  type VNode,
  type VoidElementNode,
  type WidgetNode
} from '@vitarx/runtime-core'
import { escapeHTML, tagClose, tagOpen, tagSelfClosing } from './html.js'
import type { Sink } from './sink.js'

/**
 * 序列化常规DOM元素为字符串
 * @param node - 常规元素虚拟节点
 * @param sink - 输出接收器
 * @param pathStack - 当前路径栈
 */
function serializeRegular(node: RegularElementNode, sink: Sink, pathStack: number[]) {
  const { type: tagName, props, children } = node
  const path = pathStack.length ? pathStack.join('-') : ''
  const propsWithPath = path ? { ...props, 'data-vx-path': path } : props

  sink.push(tagOpen(tagName, propsWithPath))

  if (props['v-html']) {
    sink.push(String(props['v-html']))
  } else {
    children.forEach((child, index) => {
      pathStack.push(index)
      serializeVNodeToSink(child, sink, pathStack)
      pathStack.pop()
    })
  }

  sink.push(tagClose(tagName))
}

/**
 * 序列化Void元素虚拟节点为HTML字符串
 * @param node - Void元素虚拟节点对象
 * @param sink - 输出接收器
 * @param pathStack - 当前路径栈
 */
function serializeVoid(node: VoidElementNode, sink: Sink, pathStack: number[]) {
  const { type: tagName, props } = node
  const path = pathStack.length ? pathStack.join('-') : ''
  const propsWithPath = path ? { ...props, 'data-vx-path': path } : props
  sink.push(tagSelfClosing(tagName, propsWithPath))
}

/**
 * 将虚拟节点序列化到输出流中
 * @param node - 要序列化的虚拟节点
 * @param sink - 输出接收器
 * @param pathStack - 当前路径栈（用于生成 data-vx-path）
 */
export function serializeVNodeToSink(node: VNode, sink: Sink, pathStack: number[] = []): void {
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT:
      serializeRegular(node as RegularElementNode, sink, pathStack)
      break
    case NodeKind.VOID_ELEMENT:
      serializeVoid(node as VoidElementNode, sink, pathStack)
      break
    case NodeKind.TEXT:
      sink.push(escapeHTML((node as any).props.text))
      break
    case NodeKind.COMMENT:
      sink.push(`<!--${(node as any).props.text}-->`)
      break
    case NodeKind.FRAGMENT: {
      sink.push('<!--Fragment start-->')
      const { children } = node as any
      children.forEach((child: VNode, index: number) => {
        pathStack.push(index)
        serializeVNodeToSink(child, sink, pathStack)
        pathStack.pop()
      })
      sink.push('<!--Fragment end-->')
      break
    }
    case NodeKind.STATELESS_WIDGET:
    case NodeKind.STATEFUL_WIDGET: {
      const child = (node as WidgetNode).instance?.child
      if (child) serializeVNodeToSink(child, sink, pathStack)
      break
    }
    default:
      break
  }
}
