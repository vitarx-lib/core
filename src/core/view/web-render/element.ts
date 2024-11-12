import {
  Fragment,
  type HtmlTag,
  isRefEl,
  isTextVNode,
  type TextVNode,
  type VDocumentFragment,
  type VElement,
  type VNode
} from '../VNode.js'
import { createScope } from '../../scope/index.js'
import { reactive } from '../../variable/index.js'
import { type ClassWidget, isClassWidget } from '../widget.js'
import { createFnWidget, type FnWidget } from '../fn-widget.js'
import { type HtmlElementTags, isArray } from '../../../index.js'
import { setAttributes } from './attributes.js'
import { createChildren } from './children.js'

/**
 * 渲染器创建的元素
 */
export type HtmlElement = Element | Text | DocumentFragment

/**
 * 渲染小部件、html元素、fragment元素、文本元素
 *
 * @param vnode
 */
export function renderElement(vnode: VNode | TextVNode): HtmlElement {
  if (isTextVNode(vnode)) return renderTextElement(vnode)
  let el: HtmlElement
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = renderHtmlElement(vnode as VNode<HtmlTag>)
      break
    case 'symbol':
      // Fragment 节点
      el = renderFragmentElement(vnode as VNode<Fragment>)
      break
    case 'function':
      el = renderWidgetElement(vnode as VNode<ClassWidget | FnWidget>)
      break
    default:
      throw new Error(`Unsupported vnode type: ${vnode.type}`)
  }
  if (el instanceof DocumentFragment) {
    vnode.el = fragmentToArray(el)
  } else {
    vnode.el = el
  }
  return el
}

// 创建文本元素
function renderTextElement(vnode: TextVNode): Text {
  const textEl = document.createTextNode(vnode.value)
  vnode.el = textEl
  return textEl
}

// 创建小部件元素
function renderWidgetElement(vnode: VNode<FnWidget | ClassWidget>): HtmlElement {
  let el: HtmlElement
  vnode.scope = createScope(() => {
    vnode.props = reactive(vnode.props, false)
    // 函数组件或类组件
    const component = isClassWidget(vnode.type)
      ? new vnode.type(vnode.props)
      : createFnWidget(vnode.type as FnWidget, vnode.props)
    if (isRefEl(vnode.ref)) vnode.ref.value = component!
    el = component!.renderer.mount()
  })
  return el!
}

// 创建html元素
function renderHtmlElement(vnode: VNode<HtmlElementTags>): HTMLElement {
  const el = document.createElement(vnode.type)
  setAttributes(el, vnode.props)
  createChildren(el, vnode.children)
  if (isRefEl(vnode.ref)) vnode.ref.value = el
  return el
}

// 创建 Fragment 元素
export function renderFragmentElement(vnode: VNode<Fragment>): DocumentFragment {
  const el = document.createDocumentFragment()
  if (!vnode.children) {
    // 创建一个空文本节点，用于占位 document.createComment('注释节点占位')
    el.appendChild(document.createTextNode(''))
    if (isRefEl(vnode.ref)) vnode.ref.value = []
  } else {
    createChildren(el, vnode.children)
    if (isRefEl(vnode.ref)) vnode.ref.value = fragmentToArray(el)
  }
  return el
}

/**
 * 删除元素
 *
 * @param el
 */
export function removeElement(el: VElement | null) {
  if (!el) return
  if (Array.isArray(el)) {
    // 删除旧节点
    el.forEach(item => item.remove())
  } else {
    el?.remove()
  }
}

/**
 * `Node`数组转换为片段
 *
 * @param nodes
 */
function arrayToFragment(nodes: VDocumentFragment): DocumentFragment {
  const el = document.createDocumentFragment()
  for (let i = 0; i < nodes.length; i++) {
    el.appendChild(nodes[i])
  }
  return el
}

/**
 * 片段转node数组
 *
 * @param el
 */
export function fragmentToArray(el: DocumentFragment): VDocumentFragment {
  const els: Node[] = []
  for (let i = 0; i < el.childNodes.length; i++) {
    els.push(el.childNodes[i])
  }
  return els as VDocumentFragment
}

/**
 * VElement 转 HTMLElement
 *
 * @param el
 * @constructor
 */
export function VElementToHTMLElement(
  el: VElement | DocumentFragment
): Element | Text | DocumentFragment {
  return isArray(el) ? arrayToFragment(el) : el
}
