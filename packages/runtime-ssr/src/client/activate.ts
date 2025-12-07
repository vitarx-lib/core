import {
  type FragmentNode,
  getRenderer,
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
import { isArray, logger } from '@vitarx/utils'
import { normalRender } from './render.js'
import {
  appendChild,
  cleanupExtraDom,
  cleanupFragmentRange,
  countNodesBetween,
  getFirstDomNode,
  insertBefore,
  replaceChild
} from './utils.js'

type NodeAsyncMap = WeakMap<VNode, Promise<unknown>>

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
  container: Element | HostElements[],
  nodeAsyncMap: NodeAsyncMap,
  nodeIndex: number = 0
): Promise<number> {
  let nextIndex = nodeIndex + 1 // 初始化下一个节点的索引

  // 1. Widget（包含异步逻辑）
  if (isWidgetNode(node)) {
    const pendingTask = nodeAsyncMap.get(node)
    if (pendingTask) {
      await pendingTask
      nodeAsyncMap.delete(node)
    }
    const child = (node as WidgetNode).instance!.child
    nextIndex = await hydrateNode(child, container, nodeAsyncMap, nodeIndex)
    invokeDirHook(node, 'created')
    node.state = NodeState.Rendered
    return nextIndex
  }

  // 2. 非 Widget
  const renderer = getRenderer()
  const reuse = getFirstDomNode(container, nodeIndex)
  const { type: tagName, props, children, kind } = node as RegularElementNode

  // 未找到可复用 DOM → 正常渲染并插入
  if (!reuse) {
    logger.warn(`[Hydration] Cannot find element for <${tagName}>`, node.devInfo?.source)
    normalRender(node)
    const element = node.el!
    appendChild(container, element)
    if (renderer.isFragment(element)) {
      nextIndex += countNodesBetween(container, element.$startAnchor, element.$endAnchor) + 1
    }
    return nextIndex
  }

  // 标签 / 类型 不匹配 → fallback 渲染替换
  if (reuse.kind !== kind || reuse.tag !== tagName) {
    logger.warn(
      `[Hydration] Element mismatch: expected <${tagName}> but found ` +
        `<${reuse.tag}> at index ${nodeIndex}. ` +
        `This may happen if the server-rendered HTML doesn't match the client-side VNode structure.`,
      node.devInfo?.source
    )
    nextIndex = reuse.nextIndex

    normalRender(node)
    const element = node.el!
    if (isArray(reuse.el)) {
      insertBefore(container, element, reuse.el[0])
      for (const child of reuse.el) child.remove()
    } else {
      replaceChild(container, element, reuse.el)
    }
    // 片段需要特殊计算位置
    if (renderer.isFragment(element)) {
      nextIndex += countNodesBetween(container, element.$startAnchor, element.$endAnchor) + 1
    }
    return nextIndex
  }

  // 3. 匹配成功，按类型处理
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT: {
      const el = reuse.el as HostElements
      node.el = el
      renderer.setAttributes(el, props)

      // hydrate children
      for (let i = 0; i < children.length; i++) {
        await hydrateNode(children[i], el as unknown as Element, nodeAsyncMap, i)
      }
      // 🔥 清除多余 SSR DOM
      if (!props['v-html']) cleanupExtraDom(node as RegularElementNode)
      invokeDirHook(node, 'created')
      break
    }
    case NodeKind.VOID_ELEMENT: {
      node.el = reuse.el as HostElements
      renderer.setAttributes(reuse.el as HostElements, props)
      invokeDirHook(node, 'created')
      break
    }
    case NodeKind.TEXT:
    case NodeKind.COMMENT: {
      node.el = reuse.el as unknown as HostTextElement
      renderer.setText(node.el, props.text)
      break
    }
    case NodeKind.FRAGMENT: {
      const reuseEl = reuse.el as HostElements[]
      const fragment = document.createDocumentFragment() as HostFragmentElement

      fragment.$startAnchor = reuseEl[0] as unknown as HostCommentElement
      fragment.$endAnchor = reuseEl[reuseEl.length - 1] as unknown as HostCommentElement
      fragment.$vnode = node as FragmentNode

      node.el = fragment

      for (let i = 0; i < children.length; i++) {
        await hydrateNode(children[i], reuseEl, nodeAsyncMap, i + 1)
      }

      // 🔥 清除 Fragment 区间内多余的真实 DOM
      cleanupFragmentRange(node as FragmentNode)

      node.state = NodeState.Rendered
      break
    }
    default:
      throw new Error(`[Hydration] Unknown node kind: ${node.kind}`)
  }
  node.state = NodeState.Rendered
  return nextIndex
}
