import {
  NodeKind,
  type RegularElementNode,
  StyleUtils,
  type VNode,
  type VoidElementNode,
  type WidgetNode,
  withDirectives
} from '@vitarx/runtime-core'
import { escapeHTML, tagClose, tagOpen, tagSelfClosing } from './html.js'
import type { Sink } from './sink.js'

/**
 * 序列化常规DOM元素为字符串
 * @param node - 常规元素虚拟节点
 * @param sink - 输出接收器
 */
function serializeRegular(node: RegularElementNode, sink: Sink) {
  const { type: tagName, props, children } = node

  if (node.directives?.get('show')) {
    const show = node.directives.get('show')![1]
    if (!show) props.style = StyleUtils.mergeCssStyle(props.style || {}, { display: 'none' })
  }

  sink.push(tagOpen(tagName, props))

  if (props['v-html']) {
    sink.push(String(props['v-html']))
  } else {
    children.forEach(child => {
      serializeVNodeToSink(child, sink)
    })
  }

  sink.push(tagClose(tagName))
}

/**
 * 序列化Void元素虚拟节点为HTML字符串
 * @param node - Void元素虚拟节点对象
 * @param sink - 输出接收器
 */
function serializeVoid(node: VoidElementNode, sink: Sink) {
  const { type: tagName, props } = node
  if (node.directives?.get('show')) {
    const show = node.directives.get('show')![1]
    if (!show) props.style = StyleUtils.mergeCssStyle(props.style || {}, { display: 'none' })
  }
  sink.push(tagSelfClosing(tagName, props))
}

/**
 * 将虚拟节点序列化到输出流中
 * @param node - 要序列化的虚拟节点
 * @param sink - 输出接收器
 */
export function serializeVNodeToSink(node: VNode, sink: Sink): void {
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT:
      serializeRegular(node as RegularElementNode, sink)
      break
    case NodeKind.VOID_ELEMENT:
      serializeVoid(node as VoidElementNode, sink)
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
      children.forEach((child: VNode) => {
        serializeVNodeToSink(child, sink)
      })
      sink.push('<!--Fragment end-->')
      break
    }
    case NodeKind.STATELESS_WIDGET:
    case NodeKind.STATEFUL_WIDGET: {
      const child = (node as WidgetNode).instance?.child!
      // 父组件的 show 指令会应用到子组件上
      if (node.directives?.get('show') && !child.directives?.get('show')) {
        withDirectives(child, [node.directives?.get('show')!])
      }
      serializeVNodeToSink(child, sink)
      break
    }
    default:
      break
  }
}
