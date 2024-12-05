import { createScope } from '../../scope/index.js'
import { reactive } from '../../variable/index.js'
import { setAttributes } from './attributes.js'
import { renderChildren } from './children.js'
import type { FnWidgetConstructor, WidgetType } from '../../widget/index.js'
import { createFnWidget, isClassWidgetConstructor } from '../../widget/index.js'
import { __WidgetPropsSelfNodeSymbol__ } from '../../widget/constant.js'
import type { Fragment, TextVNode, VNode } from '../../vnode/index.js'
import { isRefEl, isTextVNode } from '../../vnode/index.js'
import {
  type ContainerElement,
  type HtmlElement,
  type HtmlTags,
  type VDocumentFragment
} from './index.js'


/**
 * 渲染小部件、html元素、fragment元素、文本元素
 *
 * @param vnode - 虚拟节点
 * @param parent - 父元素
 */
export function renderElement(vnode: VNode | TextVNode, parent?: ContainerElement): HtmlElement {
  // 如果节点已渲染，则直接返回，避免重复渲染
  if (vnode.el) {
    parent?.appendChild(recoveryFragment(vnode.el))
    return vnode.el
  }
  if (isTextVNode(vnode)) return renderTextElement(vnode, parent)
  let el: HtmlElement
  switch (typeof vnode.type) {
    case 'string':
      // HTML 元素节点
      el = renderHtmlElement(vnode as VNode<HtmlTags>, parent)
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
 * 创建文本元素
 *
 * @param vnode - 文本节点
 * @param parent - 父元素
 */
export function renderTextElement(vnode: TextVNode, parent?: ContainerElement): Text {
  const textEl = document.createTextNode(vnode.value)
  vnode.el = textEl
  if (parent) parent.appendChild(textEl)
  return textEl
}

/**
 * 渲染小部件
 *
 * @param vnode - 组件虚拟节点对象
 * @param parent - 父元素
 */
export function renderWidgetElement(
  vnode: VNode<WidgetType>,
  parent?: ContainerElement
): HtmlElement {
  createScope(() => {
    Object.defineProperty(vnode.props, __WidgetPropsSelfNodeSymbol__, {
      value: vnode
    })
    // 包装props为响应式对象
    vnode.props = reactive(vnode.props, false)
    // 实例化函数组件或类组件
    vnode.instance = isClassWidgetConstructor(vnode.type)
      ? new vnode.type(vnode.props)
      : createFnWidget(vnode as VNode<FnWidgetConstructor>)
    if (isRefEl(vnode.ref)) vnode.ref.value = vnode.instance
    vnode.el = vnode.instance.renderer.render(parent)
  }, false)
  return vnode.el!
}

/**
 * 创建html元素
 *
 * @param vnode - html元素虚拟节点对象
 * @param parent - 父元素
 */
export function renderHtmlElement(vnode: VNode<HtmlTags>, parent?: ContainerElement): HTMLElement {
  const el = document.createElement(vnode.type)
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
 */
export function renderFragmentElement(
  vnode: VNode<Fragment>,
  parent?: ContainerElement
): VDocumentFragment {
  const el = document.createDocumentFragment() as VDocumentFragment
  if (!vnode.children || vnode.children.length === 0) {
    // 创建一个空文本节点，用于占位 可替换为 document.createComment('注释节点占位')
    el.appendChild(document.createTextNode(''))
  } else {
    renderChildren(el, vnode.children)
  }
  // 备份 节点
  backupFragment(el)
  vnode.el = el
  parent?.appendChild(el)
  return el
}

/**
 * 判断是否为片段节点
 *
 * @param el
 */
export function isVDocumentFragment(el: any): el is VDocumentFragment {
  return el instanceof DocumentFragment && '__backup' in el
}

/**
 * 恢复 Fragment 元素
 *
 * @param el - DocumentFragment实例
 */
export function recoveryFragment<T>(el: T): T {
  if (isVDocumentFragment(el)) {
    for (let i = 0; i < el.__backup.length; i++) {
      el.appendChild(el.__backup[i])
    }
  }
  return el
}

/**
 * 备份 Fragment 元素
 *
 * @param el
 */
export function backupFragment(el: DocumentFragment) {
  const nodes: Node[] = []
  for (let i = 0; i < el.childNodes.length; i++) {
    nodes.push(el.childNodes[i])
  }
  ;(el as VDocumentFragment)['__backup'] = nodes as Array<Element | Text>
}
