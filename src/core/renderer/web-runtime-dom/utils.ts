import { type HtmlElement, isVDocumentFragment, type VDocumentFragment } from './type.js'
import { type ChildVNode, type Fragment, isFragmentVNode, type VNode } from '../../vnode/index.js'

/**
 * 恢复 Fragment 元素
 *
 * @param {Object} vnode - 片段节点
 */
export function recoveryDocumentFragmentChildNodes(vnode: ChildVNode): HtmlElement {
  const el = vnode.el!
  if (isFragmentVNode(vnode) && el.childNodes.length === 0) {
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
export function removeDocumentFragmentChildNodes(vnode: VNode<Fragment>) {
  const el = vnode.el
  if (!el) return
  if (vnode.children?.length) {
    // 递归恢复片段节点
    for (let i = 0; i < vnode.children.length; i++) {
      const childVNode = vnode.children[i]
      const childEl = childVNode.el! as Element
      if (isFragmentVNode(childVNode)) {
        removeDocumentFragmentChildNodes(childVNode)
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
  el['__recovery'] = () => recoveryDocumentFragmentChildNodes(vnode) as VDocumentFragment
  return el
}

/**
 * 获取片段的第一个元素
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
