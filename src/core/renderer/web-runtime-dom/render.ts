import { setAttributes } from './attributes.js'
import {
  type ChildVNode,
  type CommentVNode,
  createWidgetVNodeInstance,
  type Fragment,
  isCommentVNode,
  isRefEl,
  isTextVNode,
  type TextVNode,
  type VNode,
  type VNodeChildren,
  type WidgetType
} from '../../vnode/index.js'
import {
  createEmptyFragmentPlaceholderNode,
  expandDocumentFragment,
  isSvgElement,
  mountVNode,
  recoveryFragmentChildNodes
} from './index.js'
import type {
  ContainerElement,
  HtmlElement,
  HTMLIntrinsicTags,
  VDocumentFragment
} from '../types/index.js'

/**
 * 渲染小部件节点
 *
 * @param {VNode<WidgetType>} vnode - 小部件虚拟节点
 * @param {ContainerElement} parent - 父元素
 */
export function renderElement(vnode: VNode<WidgetType>, parent?: ContainerElement): HtmlElement
/**
 * 渲染html元素节点
 *
 * @param {VNode<HTMLIntrinsicTags>} vnode - 小部件虚拟节点
 * @param {ContainerElement} parent - 父元素
 */
export function renderElement(vnode: VNode<HTMLIntrinsicTags>, parent?: ContainerElement): Element
/**
 * 渲染片段节点
 *
 * @param {VNode<Fragment>} vnode - 片段虚拟节点
 * @param {ContainerElement} parent - 父元素
 */
export function renderElement(vnode: VNode<Fragment>, parent?: ContainerElement): VDocumentFragment
/**
 * 渲染注释节点
 *
 * @param {CommentVNode} vnode - 注释虚拟节点
 * @param {ContainerElement} parent - 父元素
 */
export function renderElement(vnode: CommentVNode, parent?: ContainerElement): Comment
/**
 * 渲染文本节点
 *
 * @param {TextVNode} vnode - 文本虚拟节点
 * @param parent - 父元素
 */
export function renderElement(vnode: TextVNode, parent?: ContainerElement): Text
/**
 * 渲染小部件、html元素、fragment元素、文本元素，注释元素
 *
 * @param vnode - 虚拟节点
 * @param parent - 父元素
 */
export function renderElement(vnode: ChildVNode, parent?: ContainerElement): HtmlElement
/**
 * 渲染元素
 *
 * @param {Object} vnode - 虚拟节点
 * @param {Object} parent - 父节点
 * @return {Object} - HTML元素实例
 */
export function renderElement(vnode: ChildVNode, parent?: ContainerElement): HtmlElement {
  // 如果节点已渲染，则直接返回，避免重复渲染
  if (vnode.el) {
    parent?.appendChild(recoveryFragmentChildNodes(vnode.el))
    return vnode.el as HtmlElement
  }
  if (isTextVNode(vnode)) return renderTextElement(vnode, parent)
  if (isCommentVNode(vnode)) return renderCommentElement(vnode, parent)
  let el: HtmlElement
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = renderHtmlElement(vnode as VNode<HTMLIntrinsicTags>, parent)
      break
    case 'symbol':
      // Fragment 节点
      el = renderFragmentElement(vnode as VNode<Fragment>, parent)
      break
    case 'function':
      el = renderWidgetElement(vnode as VNode<WidgetType>, parent)
      break
    default:
      throw new Error(`Unsupported vnode type: ${vnode.type}`)
  }
  return el
}

/**
 * 渲染文本元素
 *
 * @param vnode - 文本节点
 * @param parent - 父元素
 * @return {Text} - 文本元素实例
 */
export function renderTextElement(vnode: TextVNode, parent?: ContainerElement): Text {
  const textEl = document.createTextNode(vnode.value)
  vnode.el = textEl
  parent?.appendChild(textEl)
  return textEl
}

/**
 * 渲染注释元素
 *
 * @param vnode
 * @param parent
 * @return {Comment} - 注释元素实例
 */
export function renderCommentElement(vnode: CommentVNode, parent?: ContainerElement): Comment {
  const commentEl = document.createComment(vnode.value)
  vnode.el = commentEl
  parent?.appendChild(commentEl)
  return commentEl
}

/**
 * 渲染小部件
 *
 * @param vnode - 组件虚拟节点对象
 * @param parent - 父元素
 * @return {HTMLElement} - HTML元素实例
 */
export function renderWidgetElement(
  vnode: VNode<WidgetType>,
  parent?: ContainerElement
): HtmlElement {
  let el: HtmlElement
  createWidgetVNodeInstance(vnode, instance => {
    // 渲染
    el = instance['renderer'].render(parent)
    // 动态设置带有 getter 的属性 el，确保获取的el始终正确
    Object.defineProperty(vnode, 'el', {
      get() {
        return this.instance?.el
      },
      configurable: false, // 允许重新定义属性
      enumerable: true // 允许枚举该属性
    })
  })
  return el!
}

/**
 * 创建html元素
 *
 * @param vnode - html元素虚拟节点对象
 * @param parent - 父元素
 * @return {HTMLElement | SVGElement} - HTML元素实例
 */
export function renderHtmlElement(
  vnode: VNode<HTMLIntrinsicTags>,
  parent?: ContainerElement
): HTMLElement | SVGElement {
  const el = isSvgElement(vnode)
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.type)
    : document.createElement(vnode.type)
  setAttributes(el, vnode.props)
  // 挂载到父节点
  if (parent) parent.appendChild(el)
  vnode.el = el
  renderChildren(el, vnode.children)
  if (isRefEl(vnode.ref)) vnode.ref.value = el
  return el
}

/**
 * 渲染Fragment元素
 *
 * @param vnode - Fragment虚拟节点对象
 * @param parent - 父元素
 * @return {DocumentFragment} - 片段元素实例
 */
export function renderFragmentElement(
  vnode: VNode<Fragment>,
  parent?: ContainerElement
): VDocumentFragment {
  const el = document.createDocumentFragment() as VDocumentFragment
  if (!vnode.children || vnode.children.length === 0) {
    // 空片段节点
    el.appendChild(createEmptyFragmentPlaceholderNode(el))
  } else {
    renderChildren(el, vnode.children)
  }
  vnode.el = el
  // 拓展片段元素
  expandDocumentFragment(vnode)
  parent?.appendChild(el)
  return el
}

/**
 * 渲染子节点列表
 *
 * @param {ContainerElement} parent - 父元素
 * @param {VNodeChildren} children - 子节点列表
 * @param {boolean} [triggerMountHook=false] - 自动触发挂载钩子
 */
export function renderChildren(
  parent: ContainerElement,
  children: VNodeChildren | ChildVNode,
  triggerMountHook: boolean = false
): void {
  if (Array.isArray(children)) {
    for (const child of children) {
      renderElement(child, parent)
      if (triggerMountHook) mountVNode(child)
    }
  } else {
    renderElement(children, parent)
    if (triggerMountHook) mountVNode(children)
  }
}
