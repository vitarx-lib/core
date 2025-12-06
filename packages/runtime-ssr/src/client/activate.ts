import {
  type FragmentNode,
  type HostCommentElement,
  type HostElements,
  type HostFragmentElement,
  type HostTextElement,
  invokeDirHook,
  isWidgetNode,
  NodeKind,
  NodeState,
  type RegularElementNode,
  type VNode,
  type WidgetNode
} from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom'
import { isArray } from '@vitarx/utils'
import { normalRender } from './render.js'
import { getFirstDomNode } from './utils.js'

type NodeAsyncMap = WeakMap<VNode, Promise<unknown>>

/** 移除 container 下指定 index 之后的所有多余节点 */
function cleanupExtraDom(container: Element, expectedCount: number) {
  while (container.childNodes.length > expectedCount) {
    const extra = container.childNodes[expectedCount]
    extra.remove()
  }
}

/** 清除 Fragment 范围中过多的真实 DOM */
function cleanupFragmentRange(start: Comment, end: Comment, usedCount: number) {
  let n = start.nextSibling
  let count = 0

  // 跳过已匹配 children 数量
  while (n && n !== end && count < usedCount) {
    n = n.nextSibling
    count++
  }

  // 删除剩余
  while (n && n !== end) {
    const next = n.nextSibling
    n.remove()
    n = next
  }
}

/**
 * 水合节点函数，用于将服务端渲染的DOM与客户端虚拟DOM进行匹配和同步
 * @param node - 当前需要水合的虚拟DOM节点
 * @param container - 包含节点的DOM容器
 * @param nodeAsyncMap - 存储异步任务映射的Map
 * @param nodeIndex - 当前节点在容器中的索引位置，默认为0
 * @returns Promise<number> - 返回下一个节点的索引位置
 */
export async function hydrateNode(
  node: VNode,
  container: Element,
  nodeAsyncMap: NodeAsyncMap,
  nodeIndex: number = 0
): Promise<number> {
  let nextIndex = nodeIndex + 1 // 初始化下一个节点的索引

  // ---------------------------
  // 1. Widget（包含异步逻辑）
  // ---------------------------
  if (isWidgetNode(node)) {
    const pendingTask = nodeAsyncMap.get(node)
    if (pendingTask) {
      await pendingTask
      nodeAsyncMap.delete(node)
    }

    const child = (node as WidgetNode).instance!.child
    if (child) {
      return await hydrateNode(child, container, nodeAsyncMap, nodeIndex)
    }

    invokeDirHook(node, 'created')
    node.state = NodeState.Rendered
    return nextIndex
  }

  // ---------------------------
  // 2. 非 Widget
  // ---------------------------
  const renderer = new DomRenderer()
  const reuse = getFirstDomNode(container, nodeIndex)
  const { type: tagName, props, children, kind } = node as RegularElementNode

  // ---------------------------
  // 未找到可复用 DOM → 正常渲染并插入
  // ---------------------------
  if (!reuse) {
    console.warn(`[Hydration] Cannot find element for <${tagName}>`)

    normalRender(node)

    if (nodeIndex > 0) {
      const pre = container.childNodes[nodeIndex - 1]
      const next = pre?.nextSibling
      if (next) {
        container.insertBefore(node.el!, next)
        return nextIndex
      }
    }

    container.appendChild(node.el!)

    if (renderer.isFragment(node.el!)) {
      nextIndex += children.length
    }
    return nextIndex
  }

  // ---------------------------
  // 标签 / 类型 不匹配 → fallback 渲染替换
  // ---------------------------
  if (reuse.kind !== kind || reuse.tag !== tagName) {
    console.warn(`[Hydration] Element mismatch for <${tagName}>`)
    nextIndex = reuse.nextIndex

    normalRender(node)

    if (isArray(reuse.el)) {
      container.insertBefore(node.el!, reuse.el[0])
      for (const child of reuse.el) child.remove()
      nextIndex -= reuse.el.length
    } else {
      container.replaceChild(node.el!, reuse.el)
    }

    if (renderer.isFragment(node.el!)) {
      nextIndex += children.length
    }
    return nextIndex
  }

  // ---------------------------
  // 3. 匹配成功，按类型处理
  // ---------------------------
  switch (node.kind) {
    // ---------------------------
    // Regular Element
    // ---------------------------
    case NodeKind.REGULAR_ELEMENT: {
      const el = reuse.el as HostElements
      node.el = el
      renderer.setAttributes(el, props)

      // hydrate children
      let lastChildIndex = 0
      for (let i = 0; i < children.length; i++) {
        lastChildIndex = await hydrateNode(children[i], el as unknown as Element, nodeAsyncMap, i)
      }
      // 🔥 清除多余 SSR DOM
      cleanupExtraDom(el as unknown as Element, children.length)

      node.state = NodeState.Rendered
      invokeDirHook(node, 'created')
      break
    }

    // ---------------------------
    // Void Element
    // ---------------------------
    case NodeKind.VOID_ELEMENT: {
      node.el = reuse.el as HostElements
      renderer.setAttributes(reuse.el as HostElements, props)
      node.state = NodeState.Rendered
      invokeDirHook(node, 'created')
      break
    }

    // ---------------------------
    // Text / Comment
    // ---------------------------
    case NodeKind.TEXT:
    case NodeKind.COMMENT: {
      node.el = reuse.el as unknown as HostTextElement
      renderer.setText(node.el, props.text)
      node.state = NodeState.Rendered
      break
    }

    // ---------------------------
    // Fragment
    // ---------------------------
    case NodeKind.FRAGMENT: {
      const reuseEl = reuse.el as HostElements[]
      const fragment = document.createDocumentFragment() as HostFragmentElement

      fragment.$startAnchor = reuseEl[0] as unknown as HostCommentElement
      fragment.$endAnchor = reuseEl[reuseEl.length - 1] as unknown as HostCommentElement
      fragment.$vnode = node as FragmentNode

      node.el = fragment

      let cur = reuse.nextIndex
      for (let i = 0; i < children.length; i++) {
        cur = await hydrateNode(children[i], container, nodeAsyncMap, cur)
      }

      // 🔥 清除 Fragment 区间内多余的真实 DOM
      cleanupFragmentRange(fragment.$startAnchor, fragment.$endAnchor, children.length)

      node.state = NodeState.Rendered
      break
    }

    default:
      throw new Error(`[Hydration] Unknown node kind: ${node.kind}`)
  }

  node.state = NodeState.Rendered
  return nextIndex
}
