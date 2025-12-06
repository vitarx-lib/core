import type { HostFragmentElement, VNode } from '@vitarx/runtime-core'
import { isWidgetNode, NodeKind, NodeState } from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom'

/**
 * 渐进式激活函数
 *
 * 按照 VNode 树的结构，从服务端渲染的 DOM 中按顺序匹配节点并激活。
 * 移除了 path 机制，因为服务端和客户端的渲染顺序可能不一致
 * （服务端 onRender 中可能有异步请求，响应顺序不确定，而客户端数据被缓存复用不会发起请求）。
 *
 * 核心流程：
 * 1. 按照 VNode 树结构顺序遍历查找 DOM 节点
 * 2. 设置 node.el 和 node.state = NodeState.Rendered
 * 3. 绑定事件监听器
 * 4. 递归激活子节点
 *
 * @param vnode - 虚拟节点
 * @param container - 容器元素或当前激活的父元素
 * @param nodeIndex - 当前节点在父节点中的索引（用于顺序匹配）
 *
 * @example
 * ```ts
 * await activateNode(rootNode, document.querySelector('#app')!)
 * ```
 */
export async function activateNode(
  vnode: VNode,
  container: Element,
  nodeIndex: { text: number; comment: number; element: number } = {
    text: 0,
    comment: 0,
    element: 0
  }
): Promise<void> {
  const renderer = new DomRenderer()

  switch (vnode.kind) {
    case NodeKind.REGULAR_ELEMENT: {
      const { type: tagName, props, children } = vnode as any

      // 按顺序匹配 DOM 元素
      const elements = Array.from(container.children)
      const el = elements[nodeIndex.element] || null
      nodeIndex.element++

      if (!el) {
        console.warn(`[Hydration] Cannot find element for <${tagName}>`)
        return
      }

      // 设置节点元素和状态
      vnode.el = el as any
      vnode.state = NodeState.Rendered

      // 绑定事件监听器（不修改静态属性）
      bindEventListeners(el, props, renderer)

      // 递归激活子节点
      if (!props['v-html'] && children && children.length > 0) {
        const childNodeIndex = { text: 0, comment: 0, element: 0 }
        for (let i = 0; i < children.length; i++) {
          await activateNode(children[i], el, childNodeIndex)
        }
      }

      break
    }

    case NodeKind.VOID_ELEMENT: {
      const { type: tagName, props } = vnode as any

      // 按顺序匹配 DOM 元素
      const elements = Array.from(container.children)
      const el = elements[nodeIndex.element] || null
      nodeIndex.element++

      if (!el) {
        console.warn(`[Hydration] Cannot find void element for <${tagName}>`)
        return
      }

      // 设置节点元素和状态
      vnode.el = el as any
      vnode.state = NodeState.Rendered

      // 绑定事件监听器
      bindEventListeners(el, props, renderer)

      break
    }

    case NodeKind.TEXT: {
      const { props } = vnode as any
      const expectedText = props.text

      // 按顺序查找文本节点
      let textNode: Node | null = null
      let currentIndex = 0

      for (const child of Array.from(container.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (currentIndex === nodeIndex.text) {
            textNode = child
            break
          }
          currentIndex++
        }
      }

      nodeIndex.text++

      if (!textNode) {
        console.warn(`[Hydration] Cannot find text node for "${expectedText}"`)
        return
      }

      // 设置节点元素和状态
      vnode.el = textNode as any
      vnode.state = NodeState.Rendered

      break
    }

    case NodeKind.COMMENT: {
      const { props } = vnode as any
      const expectedComment = props.text

      // 按顺序查找注释节点（跳过 Fragment 锚点）
      let commentNode: Node | null = null
      let currentIndex = 0

      for (const child of Array.from(container.childNodes)) {
        if (child.nodeType === Node.COMMENT_NODE) {
          const text = child.textContent || ''
          // 跳过 Fragment 锚点注释
          if (text === 'Fragment start' || text === 'Fragment end') {
            continue
          }
          if (currentIndex === nodeIndex.comment) {
            commentNode = child
            break
          }
          currentIndex++
        }
      }

      nodeIndex.comment++

      if (!commentNode) {
        console.warn(`[Hydration] Cannot find comment node for "<!--${expectedComment}-->"`)
        return
      }

      // 设置节点元素和状态
      vnode.el = commentNode as any
      vnode.state = NodeState.Rendered

      break
    }

    case NodeKind.FRAGMENT: {
      const { children } = vnode as any

      // 查找 Fragment 锚点注释
      let startAnchor: Comment | null = null
      let endAnchor: Comment | null = null

      for (const child of Array.from(container.childNodes)) {
        if (child.nodeType === Node.COMMENT_NODE) {
          const text = child.textContent || ''
          if (text === 'Fragment start' && !startAnchor) {
            startAnchor = child as Comment
          } else if (text === 'Fragment end' && startAnchor) {
            endAnchor = child as Comment
            break
          }
        }
      }

      if (!startAnchor || !endAnchor) {
        console.warn('[Hydration] Cannot find Fragment anchors')
        return
      }

      // 创建 DocumentFragment 并设置锚点
      const fragment = document.createDocumentFragment() as HostFragmentElement
      fragment.$startAnchor = startAnchor
      fragment.$endAnchor = endAnchor
      fragment.$vnode = vnode as any

      // 设置节点元素和状态
      vnode.el = fragment as any
      vnode.state = NodeState.Rendered

      // 递归激活子节点（在 startAnchor 和 endAnchor 之间）
      const fragmentContainer = startAnchor.parentElement!
      const childNodeIndex = { text: 0, comment: 0, element: 0 }

      for (let i = 0; i < children.length; i++) {
        await activateNode(children[i], fragmentContainer, childNodeIndex)
      }

      break
    }

    case NodeKind.STATELESS_WIDGET:
    case NodeKind.STATEFUL_WIDGET: {
      // 递归激活 Widget 的 child
      if (isWidgetNode(vnode)) {
        const child = vnode.instance?.child
        if (child) {
          await activateNode(child, container, nodeIndex)
          // 将 child 的 el 赋值给 Widget 节点
          vnode.el = child.el
          vnode.state = NodeState.Rendered
        }
      }
      break
    }

    default:
      console.warn(`[Hydration] Unknown node kind: ${vnode.kind}`)
  }
}

/**
 * 绑定事件监听器
 *
 * 仅处理事件属性（以 on 开头的函数属性），不修改静态属性。
 *
 * @param el - DOM 元素
 * @param props - 虚拟节点属性
 * @param renderer - DOM 渲染器
 */
function bindEventListeners(el: Element, props: Record<string, any>, renderer: DomRenderer): void {
  for (const key in props) {
    const value = props[key]
    // 只绑定事件监听器
    if (typeof value === 'function' && key.startsWith('on')) {
      renderer.setAttribute(el as any, key, value)
    }
  }
}
