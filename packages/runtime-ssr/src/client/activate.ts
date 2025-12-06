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

// 节点异步任务映射类型
type NodeAsyncMap = WeakMap<VNode, Promise<unknown>>
/**
 * 渐进式激活函数
 *
 * 按照 VNode 树的结构，从服务端渲染的 DOM 中按顺序匹配节点并激活。
 * 遇到有异步任务的 Widget 节点时，等待其完成后再继续处理 child。
 *
 * 核心流程：
 * 1. 按照 VNode 树结构顺序遍历查找 DOM 节点
 * 2. 遇到 Widget 节点时检查是否有异步任务，有则等待
 * 3. 设置 node.el 和 node.state = NodeState.Rendered
 * 4. 绑定事件监听器
 * 5. 递归激活子节点
 *
 * @param node - 虚拟节点
 * @param container - 容器元素或当前激活的父元素
 * @param nodeAsyncMap - 节点异步任务映射
 * @param nodeIndex - 当前节点在父节点中的索引（用于顺序匹配）
 *
 * @example
 * ```ts
 * await hydrateNode(rootNode, containerEl, nodeAsyncMap)
 * ```
 */
export async function hydrateNode(
  node: VNode,
  container: Element,
  nodeAsyncMap: NodeAsyncMap,
  nodeIndex: number = 0
): Promise<number> {
  let nextIndex = nodeIndex + 1
  if (isWidgetNode(node)) {
    // 检查该节点是否有绑定的异步任务，有则等待其完成
    const pendingTask = nodeAsyncMap.get(node)
    if (pendingTask) {
      await pendingTask
      nodeAsyncMap.delete(node)
    }
    // 异步完成后递归激活 Widget 的 child
    const child = (node as WidgetNode).instance!.child
    if (child) {
      return await hydrateNode(child, container, nodeAsyncMap, nodeIndex)
    }
    invokeDirHook(node, 'created')
    node.state = NodeState.Rendered
    return nextIndex
  } else {
    const renderer = new DomRenderer()
    // 复用元素
    const reuse = getFirstDomNode(container, nodeIndex)
    const { type: tagName, props, children, kind } = node as RegularElementNode
    // 没有复用到元素，节点进行正常渲染
    if (!reuse) {
      console.warn(`[Hydration] Cannot find element for <${tagName}>`)
      normalRender(node)
      if (nodeIndex > 0) {
        const preNode = container.childNodes[nodeIndex - 1]
        const nextSibling = preNode?.nextSibling
        if (nextSibling) {
          container.insertBefore(node.el!, nextSibling)
          return nextIndex
        }
      }
      container.appendChild(node.el!)
      if (renderer.isFragment(node.el!)) {
        // 如果插入的是片段元素，也需要重置索引
        nextIndex += children.length
      }
      return nextIndex
    }
    // 元素类型 或 标签不匹配
    if (reuse.kind !== kind || reuse.tag !== tagName) {
      nextIndex = reuse.nextIndex
      console.warn(`[Hydration] Cannot find element for <${tagName}>`)
      normalRender(node)
      if (isArray(reuse.el)) {
        // 插入元素到片段之前
        container.insertBefore(node.el!, reuse.el[0])
        // 删除片段元素
        for (const childNode of reuse.el) {
          childNode.remove()
        }
        // 重置下一个索引，因为片段元素被删除
        nextIndex -= reuse.el.length
      } else {
        container.replaceChild(node.el!, reuse.el)
      }
      if (renderer.isFragment(node.el!)) {
        // 如果插入的是片段元素，也需要重置索引
        nextIndex += children.length
      }
      return nextIndex
    }
    // 复用到元素，进行属性设置和子节点激活
    switch (node.kind) {
      case NodeKind.REGULAR_ELEMENT: {
        // 设置节点元素和状态
        node.el = reuse.el as HostElements
        renderer.setAttributes(reuse.el as HostElements, props)
        // 递归激活子节点
        if (children.length > 0) {
          for (let i = 0; i < children.length; i++) {
            await hydrateNode(children[i], reuse.el as Element, nodeAsyncMap, i)
          }
        }
        node.state = NodeState.Rendered
        invokeDirHook(node, 'created')
        break
      }

      case NodeKind.VOID_ELEMENT: {
        // 设置节点元素和状态
        node.el = reuse.el as HostElements
        renderer.setAttributes(reuse.el as HostElements, props)
        node.state = NodeState.Rendered
        invokeDirHook(node, 'created')
        break
      }
      case NodeKind.COMMENT:
      case NodeKind.TEXT: {
        node.el = reuse.el as unknown as HostTextElement
        renderer.setText(node.el, props.text)
        node.state = NodeState.Rendered
        break
      }

      case NodeKind.FRAGMENT: {
        // 创建 DocumentFragment 并设置锚点
        const fragment = document.createDocumentFragment() as HostFragmentElement
        const reuseEl = reuse.el as HostElements[]
        fragment.$startAnchor = reuseEl[0] as unknown as HostCommentElement
        fragment.$endAnchor = reuseEl[reuseEl.length - 1] as unknown as HostCommentElement
        fragment.$vnode = node as FragmentNode
        // 设置节点元素和状态
        node.el = fragment
        // 递归激活子节点
        for (let i = 0; i < children.length; i++) {
          nextIndex = await hydrateNode(children[i], container, nodeAsyncMap, nextIndex)
        }
        break
      }
      default:
        throw new Error(`[Hydration] Unknown node kind: ${node.kind}`)
    }
    node.state = NodeState.Rendered
    return nextIndex
  }
}
