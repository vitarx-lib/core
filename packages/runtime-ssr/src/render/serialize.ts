import {
  LifecycleHooks,
  NodeKind,
  type RegularElementVNode,
  StatefulWidgetRuntime,
  type VNode,
  type VoidElementVNode,
  type WidgetVNode
} from '@vitarx/runtime-core'
import { escapeHTML, tagClose, tagOpen, tagSelfClosing } from '../string/helpers.js'
import { StringSink } from '../string/StringSink.js'

/**
 * 序列化常规DOM元素为字符串
 * @param node - 常规元素虚拟节点
 * @param sink - 字符串接收器
 * @param pathStack - 当前路径栈
 */
function serializeRegular(node: RegularElementVNode, sink: StringSink, pathStack: number[]) {
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
 * @param sink - 字符串接收器
 * @param pathStack - 当前路径栈
 */
function serializeVoid(node: VoidElementVNode, sink: StringSink, pathStack: number[]) {
  const { type: tagName, props } = node
  const path = pathStack.length ? pathStack.join('-') : ''
  const propsWithPath = path ? { ...props, 'data-vx-path': path } : props
  sink.push(tagSelfClosing(tagName, propsWithPath))
}

/**
 * 将虚拟节点序列化到输出流中
 * @param node - 要序列化的虚拟节点
 * @param sink - 字符串接收器
 * @param pathStack - 当前路径栈（用于生成 data-vx-path）
 */
export function serializeVNodeToSink(
  node: VNode,
  sink: StringSink,
  pathStack: number[] = []
): void {
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT:
      serializeRegular(node as RegularElementVNode, sink, pathStack)
      break
    case NodeKind.VOID_ELEMENT:
      serializeVoid(node as VoidElementVNode, sink, pathStack)
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
      const instance = (node as WidgetVNode).runtimeInstance
      if (!instance) throw new Error('Widget runtime instance is not available')
      serializeVNodeToSink(instance.child, sink, pathStack)
      if (node.kind === NodeKind.STATEFUL_WIDGET) {
        // 有状态的组件服务端也需要调用 销毁钩子，使其清理资源
        ;(instance as StatefulWidgetRuntime).invokeHook(LifecycleHooks.destroy)
      }
      // 销毁运行时实例
      instance.destroy()
      break
    }
    default:
      break
  }
}
