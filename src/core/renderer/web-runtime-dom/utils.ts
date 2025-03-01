import {
  findParentVNode,
  type Fragment,
  type HTMLElementVNode,
  isFragmentVNode,
  type VNode
} from '../../vnode/index.js'
import type { HtmlElement, VDocumentFragment } from '../types/index.js'

/**
 * 恢复 Fragment 元素
 *
 * @param {Object} vnode - 片段节点
 */
const recoveryDocumentFragmentChildNodes = (vnode: VNode<Fragment>): VDocumentFragment => {
  const el = vnode.el as VDocumentFragment
  if (el.childNodes.length === 0) {
    if (vnode.children?.length) {
      // 递归恢复片段节点
      for (let i = 0; i < vnode.children.length; i++) {
        const childVNode = vnode.children[i]
        let childEl = childVNode.el! as HtmlElement
        if (isFragmentVNode(childVNode)) {
          childEl = recoveryDocumentFragmentChildNodes(childVNode)
        }
        el.appendChild(childEl)
      }
    } else {
      // 恢复空节点
      el.appendChild((el as VDocumentFragment).__emptyElement!)
    }
  }
  return el
}

/**
 * 移除 Fragment 元素
 *
 * @param {Object} vnode - 片段节点
 */
const removeDocumentFragmentChildNodes = (vnode: VNode<Fragment>) => {
  const el = vnode.el
  if (!el) return
  if (vnode.children?.length) {
    // 递归恢复片段节点
    for (let i = 0; i < vnode.children.length; i++) {
      const childVNode = vnode.children[i]
      const childEl = childVNode.el! as Element
      if (isFragmentVNode(childVNode)) {
        removeDocumentFragmentChildNodes(childVNode)
      } else if (isVDocumentFragment(childEl)) {
        childEl.__remove()
      } else {
        childEl.remove()
      }
    }
  } else {
    el.__emptyElement?.remove()
  }
}

/**
 * 备份 Fragment 元素
 *
 * @param vnode
 */
export function expandDocumentFragment(vnode: VNode<Fragment>): VDocumentFragment {
  const el = vnode.el! as VDocumentFragment
  el['__firstChild'] = () => {
    if (vnode.children?.length) {
      return vnode.children[0].el!
    } else {
      return el['__emptyElement']!
    }
  }
  el['__lastChild'] = () => {
    if (vnode.children?.length) {
      return vnode.children[vnode.children.length - 1].el!
    } else {
      return el['__emptyElement']!
    }
  }
  el['__remove'] = () => removeDocumentFragmentChildNodes(vnode)
  el['__recovery'] = () => recoveryDocumentFragmentChildNodes(vnode)
  return el
}

/**
 * 给片段节点创建一个空占位节点
 *
 * @param el
 * @internal
 */
export function createEmptyFragmentPlaceholderNode(el: VDocumentFragment) {
  if (!el['__emptyElement']) {
    // 创建一个空节点 document.createComment('') 或 document.createTextNode('')
    el['__emptyElement'] = document.createComment('Empty Fragment Node')
  }
  return el['__emptyElement']!
}

/**
 * 获取片段的第一个元素
 *
 * 如果第一个元素是片段元素，则会继续递归获取
 *
 * @param el
 */
export function getVDocumentFragmentFirstEl(
  el: VDocumentFragment
): Exclude<HtmlElement, VDocumentFragment> {
  let first = el.__firstChild()
  while (isVDocumentFragment(first)) {
    first = first.__firstChild()
  }
  return first
}

/**
 * 获取片段的最后一个元素
 *
 * @param el
 */
export function getVDocumentFragmentLastEl(
  el: VDocumentFragment
): Exclude<HtmlElement, VDocumentFragment> {
  let last = el.__lastChild()
  while (isVDocumentFragment(last)) {
    last = el.__lastChild()
  }
  return last
}

/**
 * 恢复片段子节点
 *
 * @param el
 */
export function recoveryFragmentChildNodes<T extends HtmlElement>(el: T): T {
  if (isVDocumentFragment(el)) {
    el.__recovery()
  }
  return el
}

/**
 * 获取父元素
 *
 * 等同于 `document.getElementById(id).parentNode`，只是对片段元素进行特殊处理。
 *
 * @param el
 */
export function getElParentNode(el: HtmlElement | undefined): ParentNode | null {
  if (!el) return null
  if (isVDocumentFragment(el)) {
    return getVDocumentFragmentFirstEl(el).parentNode
  }
  return el.parentNode
}

/**
 * 判断是否为片段元素
 *
 * @param el
 */
export function isVDocumentFragment(el: any): el is VDocumentFragment {
  return el instanceof DocumentFragment
}

/**
 * 判断是否为svg元素，或是svg内部的子元素
 *
 * @param vnode - HTMLElementVNode
 * @returns {boolean}
 */
export function isSvgElement(vnode: HTMLElementVNode): boolean {
  const svgNamespace = 'http://www.w3.org/2000/svg'
  if (vnode.props.xmlns === svgNamespace) return true
  if (vnode.type === 'svg') return true
  let parent = findParentVNode(vnode)
  while (parent) {
    if (parent.type === 'svg') return true
    parent = findParentVNode(parent)
  }
  return false
}
