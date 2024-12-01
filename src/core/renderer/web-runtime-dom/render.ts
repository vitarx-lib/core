import { createScope } from '../../scope/index.js'
import { reactive } from '../../variable/index.js'
import { setAttributes } from './attributes.js'
import { renderChildren } from './children.js'
import {
  type ClassWidgetConstructor,
  createFnWidget,
  type FnWidgetConstructor,
  isClassWidgetConstructor
} from '../../widget/index.js'
import { __WidgetPropsSelfNodeSymbol__ } from '../../widget/constant.js'
import {
  type HtmlElement,
  type HtmlTags,
  type ParentElement,
  type VDocumentFragment
} from './index.js'
import {
  type Fragment,
  isRefEl,
  isTextVNode,
  type TextVNode,
  type VNode
} from '../../vnode/index.js'

/**
 * 渲染小部件、html元素、fragment元素、文本元素
 *
 * @param vnode
 * @param parent - 父元素
 */
export function renderElement(
  vnode: VNode | TextVNode,
  parent?: ParentElement
): HtmlElement | Text {
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
      el = renderWidgetElement(vnode as VNode<ClassWidgetConstructor | FnWidgetConstructor>, parent)
      break
    default:
      throw new Error(`Unsupported vnode type: ${vnode.type}`)
  }
  return el
}

// 创建文本元素
export function renderTextElement(vnode: TextVNode, parent?: ParentElement): Text {
  const textEl = document.createTextNode(vnode.value)
  vnode.el = textEl
  if (parent) parent.appendChild(textEl)
  return textEl
}

// 创建小部件元素
export function renderWidgetElement(
  vnode: VNode<FnWidgetConstructor | ClassWidgetConstructor>,
  parent?: ParentElement
): HtmlElement {
  let el: HtmlElement
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
    el = vnode.instance.renderer.mount(parent)
    // 记录el
    vnode.el = el
  }, false)
  return el!
}

// 创建html元素
export function renderHtmlElement(vnode: VNode<HtmlTags>, parent?: ParentElement): HTMLElement {
  const el = document.createElement(vnode.type)
  setAttributes(el, vnode.props)
  // 挂载到父节点
  if (parent) parent.appendChild(el)
  vnode.el = el
  renderChildren(el, vnode.children)
  if (isRefEl(vnode.ref)) vnode.ref.value = el
  return el
}

// 创建 Fragment 元素
export function renderFragmentElement(
  vnode: VNode<Fragment>,
  parent?: ParentElement
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
  if (parent) parent.appendChild(el)
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
