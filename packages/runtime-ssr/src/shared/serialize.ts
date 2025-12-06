import {
  ELEMENT_NODE_KINDS,
  NodeKind,
  type RegularElementNode,
  type VNode,
  type VoidElementNode,
  WIDGET_NODE_KINDS,
  type WidgetNode
} from '@vitarx/runtime-core'
import { deepMergeObject } from '@vitarx/utils'
import { escapeHTML, tagClose, tagOpen, tagSelfClosing } from './html.js'
import type { Sink } from './sink.js'

/**
 * 应用指令样式到 props
 * @param node - 虚拟节点
 * @param props - 节点属性对象
 */
export function applyShowDirective(node: VNode, props: Record<string, any>): void {
  if (node.directives) {
    for (const [_name, directive] of node.directives.entries()) {
      const [obj, value, arg] = directive
      const method = obj.getSSRProps
      if (typeof method === 'function') {
        const ssrProps = method({ value, oldValue: value, arg }, node)
        if (ssrProps) {
          const mergedProps = deepMergeObject(props, ssrProps)
          // 将合并后的属性写入到原props对象中，而不是替换整个props引用
          Object.assign(props, mergedProps)
        }
      }
    }
  }
}

/**
 * 将父组件的指令应用到子节点
 * @param parentNode - 父节点
 * @param childNode - 子节点
 */
export function inheritShowDirective(parentNode: VNode, childNode: VNode): void {
  if (!parentNode.directives) return
  if (ELEMENT_NODE_KINDS.has(childNode.kind) || WIDGET_NODE_KINDS.has(childNode.kind)) {
    childNode.directives ??= new Map()
    const childDirectives = childNode.directives
    for (const [name, directive] of parentNode.directives.entries()) {
      childDirectives.set(name, directive)
    }
  }
}

/**
 * 序列化常规DOM元素为字符串
 * @param node - 常规元素虚拟节点
 * @param sink - 输出接收器
 */
function serializeRegular(node: RegularElementNode, sink: Sink) {
  const { type: tagName, props, children } = node

  applyShowDirective(node, props)

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
  applyShowDirective(node, props)
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
      inheritShowDirective(node, child)
      serializeVNodeToSink(child, sink)
      break
    }
    default:
      break
  }
}
