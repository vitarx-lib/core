import {
  FragmentView,
  getRenderer,
  type HostComment,
  type HostElement,
  type HostFragment,
  type HostNode,
  type HostText,
  isComponentView,
  isDynamicView,
  type View,
  ViewKind
} from '@vitarx/runtime-core'
import { isArray, logger } from '@vitarx/utils'
import type { DOMElement, DOMNodeList } from '../shared/types.js'
import { waitAsyncInit } from '../shared/utils.js'
import { renderViewNode } from './render.js'
import {
  appendChild,
  cleanupExtraDom,
  cleanupFragmentRange,
  countNodesBetween,
  getFirstNode,
  getHostViewTag
} from './utils.js'

/**
 * 水合节点函数，用于将服务端渲染的DOM与客户端虚拟DOM进行匹配和同步
 * @param view - 当前需要水合的虚拟DOM节点
 * @param container - 包含节点的DOM容器
 * @param nodeIndex - 当前节点在容器中的索引位置，默认为0
 * @returns Promise<number> - 返回下一个节点的索引位置
 */
export async function hydrateNode(
  view: View,
  container: DOMElement | DOMNodeList,
  nodeIndex: number = 0
): Promise<number> {
  // 组件（包含异步逻辑）
  if (isComponentView(view)) {
    // 清空队列任务，确保子视图更新完成。
    await waitAsyncInit(view)
    const subView = view.instance!.subView
    return await hydrateNode(subView, container, nodeIndex)
  }
  // 动态节点
  if (isDynamicView(view)) {
    return await hydrateNode(view.current!, container, nodeIndex)
  }
  const renderer = getRenderer()
  const reuseNode = getFirstNode(container, nodeIndex)
  const kind = view.kind
  const tagName = getHostViewTag(view)
  if (!reuseNode) {
    logger.warn(`[Hydration] cannot find DOM node for <${tagName}>`, view.location)
    // 渲染出元素/节点，避免最终
    const el = renderViewNode(view, container)
    // 追加到容器中
    appendChild(container, el)
    // 如果洗渲染的是片段，则需要 +1 原因是片段有两个锚点，
    // 没有找到DOM的情况下，指针仅需进 1，实际后面已经没有节点了，下一次继续匹配还是会失败！。
    if (renderer.isFragment(el)) nodeIndex++
    return nodeIndex
  }
  if (reuseNode.kind !== kind || reuseNode.tag !== tagName) {
    logger.warn(
      `[Hydration] element mismatch: expected <${tagName}> but found <${reuseNode.tag}> at index ${nodeIndex}`,
      view.location
    )
    const el = renderViewNode(view, container)
    if (isArray(reuseNode.el)) {
      renderer.insert(el, reuseNode.el[0] as HostNode)
      for (const child of reuseNode.el) child.remove()
      // 回退指针 * 片段长度
      reuseNode.nextIndex -= reuseNode.el.length
    } else {
      renderer.replace(el, reuseNode.el as HostNode)
      // 回退指针 * 1
      reuseNode.nextIndex -= 1
    }
    // 还原指针
    return (reuseNode.nextIndex += renderer.isFragment(el) ? 2 : 1)
  }
  // 匹配成功，按类型处理
  switch (view.kind) {
    case ViewKind.ELEMENT: {
      const el = reuseNode.el as DOMElement
      view['hostNode'] = el as HostElement
      const children = view.children
      let nextIndex = 0
      if (children.length) {
        // hydrate children
        for (let i = 0; i < children.length; i++) {
          nextIndex = await hydrateNode(children[i], el, nextIndex)
        }
        // 🔥 清除多余 SSR DOM
        cleanupExtraDom(view)
      }
      break
    }
    case ViewKind.TEXT:
    case ViewKind.COMMENT: {
      view['hostNode'] = reuseNode.el as HostText
      renderer.setText(reuseNode.el as HostText, view.text)
      break
    }
    default: {
      const reuseEl = reuseNode.el as DOMNodeList
      const fragment = document.createDocumentFragment() as HostFragment
      fragment.$startAnchor = reuseEl[0] as unknown as HostComment
      fragment.$endAnchor = reuseEl.at(-1) as unknown as HostComment
      fragment.$view = view
      ;(view as FragmentView)['hostNode'] = fragment
      let nextIndex = 1
      for (const child of view.children) {
        nextIndex = await hydrateNode(child, reuseEl, nextIndex)
      }
      // 🔥 清除 Fragment 区间内多余的真实 DOM
      cleanupFragmentRange(view)
      const rawCount = reuseEl.length - 2
      const newCount = countNodesBetween(fragment.$startAnchor, fragment.$endAnchor)
      if (newCount < rawCount) {
        // 指针回退
        reuseNode.nextIndex -= rawCount - newCount
      } else if (newCount > rawCount) {
        // 指针跃进
        reuseNode.nextIndex += newCount - rawCount
      }
      break
    }
  }
  return reuseNode.nextIndex
}
