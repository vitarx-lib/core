import {
  Fragment,
  isTextVNode,
  isVNode,
  type VElement,
  type VNode,
  type VNodeChild
} from '../VNode.js'
import { isFunction } from '../../../utils/index.js'
import { type HtmlElement, removeElement, renderElement, VElementToHTMLElement } from './element.js'
import { removeAttribute, setAttribute } from './attributes.js'
import { renderChild, renderChildren } from './children.js'

/**
 * 差异更新
 *
 * @param oldVNode
 * @param newVNode
 */
export function patchUpdate(oldVNode: VNode, newVNode: VNode): VNode {
  // 类型不一致，替换原有节点
  if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
    // 获取父节点
    const parent = getParentNode(oldVNode.el)
    // 替换旧节点为新节点
    replaceVNode(newVNode, oldVNode, parent)
    return newVNode
  } else {
    // 非片段节点，则进行更新属性
    if (oldVNode.type !== Fragment) {
      patchAttrs(oldVNode, newVNode)
    }
    // 非组件节点，更新子节点
    if (!isFunction(oldVNode.type)) {
      patchChildren(oldVNode, newVNode)
    }
    return oldVNode
  }
}

/**
 * 差异化更新属性
 *
 * @param oldVNode
 * @param newVNode
 */
function patchAttrs(oldVNode: VNode, newVNode: VNode): void {
  const isWidget = isFunction(oldVNode.type),
    el = oldVNode.el as HTMLElement
  const oldAttrs = oldVNode.props as Record<string, any>
  const newAttrs = newVNode.props as Record<string, any>
  // 使用 Set 记录 oldAttrs 中的键，以便在循环中检查需要删除的属性
  const oldKeysSet = new Set(Object.keys(oldAttrs))
  // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
  Object.keys(newAttrs).forEach(key => {
    // 更新或新增属性
    if (oldAttrs[key] !== newAttrs[key]) {
      if (isWidget) {
        oldAttrs[key] = newAttrs[key]
      } else {
        setAttribute(el, key, newAttrs[key], oldAttrs[key])
      }
    }
    // 将已经处理过的 key 从 oldKeysSet 中删除
    oldKeysSet.delete(key)
  })
  // 删除 newAttrs 中不存在的旧属性
  oldKeysSet.forEach(key => {
    if (!isWidget) {
      removeAttribute(el, key, oldAttrs[key])
    }
    delete oldAttrs[key]
  })
}

/**
 * 差异化更新子节点列表
 *
 * @param oldVNode
 * @param newVNode
 */
function patchChildren(oldVNode: VNode, newVNode: VNode): boolean {
  const oldChildren = oldVNode.children
  const newChildren = newVNode.children
  if (oldChildren === newChildren) return false
  // 创建新子节点
  if (!oldChildren && newChildren) {
    const parent = oldVNode.type === Fragment ? getParentNode(oldVNode.el) : oldVNode.el
    // 渲染新的子节点
    if (parent) renderChildren(parent as HtmlElement, newChildren)
    oldVNode.children = newChildren
    return true
  }
  // 删除旧子节点
  if (!newChildren && oldChildren) {
    oldChildren.forEach(child => unmountVNode(child))
    oldVNode.children = newChildren
    return true
  }
  const maxLength = Math.max(oldChildren!.length, newChildren!.length)
  for (let i = 0; i < maxLength; i++) {
    const oldChild = oldChildren![i]
    const newChild = newChildren![i]
    oldChildren![i] = patchChild(oldVNode, oldChild, newChild)
  }
  return true
}

/**
 * 差异化更新子节点
 *
 * @param oldVNode
 * @param oldChild
 * @param newChild
 * @protected
 */
function patchChild(oldVNode: VNode, oldChild: VNodeChild, newChild: VNodeChild): VNodeChild {
  // 删除节点
  if (oldChild && !newChild) {
    unmountVNode(oldChild)
    return newChild
  }
  // 新增节点
  if (!oldChild && newChild) {
    const parent = oldVNode.type === Fragment ? getParentNode(oldVNode.el) : oldVNode.el
    // 渲染新的子节点
    if (parent) renderChild(parent as HtmlElement, newChild)
    return newChild
  }
  // 更新文本节点
  if (isTextVNode(oldChild) && isTextVNode(newChild)) {
    if (oldChild.value !== newChild.value) {
      oldChild.value = newChild.value
      oldChild.el!.nodeValue = newChild.value
    }
    return oldChild
  }
  // 更新节点
  if (isVNode(oldChild) && isVNode(newChild)) {
    return patchUpdate(oldChild, newChild)
  }
  // 替换节点
  else {
    replaceVNode(newChild, oldChild)
    return newChild
  }
}

/**
 * 卸载节点
 *
 * @param vnode - 要卸载的虚拟节点
 * @protected
 */
export function unmountVNode(vnode: VNodeChild): void {
  if (isVNode(vnode)) {
    if (vnode.instance) {
      vnode.instance!.renderer.unmount()
    } else {
      // 递归卸载子级
      vnode.children?.forEach(child => unmountVNode(child))
      // 删除元素
      removeElement(vnode.el)
    }
  } else if (isTextVNode(vnode)) {
    vnode.el?.remove()
  }
}

/**
 * 替换节点
 *
 * @param newVNode
 * @param oldVNode
 * @param parent
 */
function replaceVNode(newVNode: VNodeChild, oldVNode: VNodeChild, parent?: ParentNode | null) {
  if (parent === null) return
  if (parent === undefined) parent = getParentNode(oldVNode.el)
  // 创建新元素
  const newEl = renderElement(newVNode)
  if (parent) {
    if (isTextVNode(oldVNode)) {
      parent.replaceChild(newEl, oldVNode.el!)
    } else if (oldVNode.instance) {
      // 将新元素插入到旧元素之前
      parent.insertBefore(newEl, VElementToHTMLElement(oldVNode.el!))
      // 卸载旧节点
      unmountVNode(oldVNode)
    } else {
      replaceChild(newEl, oldVNode.el, parent)
      unmountVNode(oldVNode)
    }
  }
}

/**
 * 替换节点
 *
 * @param newEl
 * @param oldEl
 * @param parent - 不传入父节点，自动使用旧节点的父节点
 */
function replaceChild(
  newEl: VElement | HtmlElement,
  oldEl: VElement | null,
  parent: ParentNode
): void {
  if (!oldEl || !parent) return
  if (Array.isArray(oldEl)) {
    // 片段节点弹出第一个元素，用于替换
    const oldFirst = oldEl.shift()!
    // 删除其余元素
    removeElement(oldEl)
    parent.replaceChild(VElementToHTMLElement(newEl), oldFirst)
  } else {
    parent.replaceChild(VElementToHTMLElement(newEl), oldEl)
  }
}

/**
 * 获取父元素
 *
 * 等同于 `document.getElementById(id).parentNode`，只是对片段元素进行特殊处理。
 *
 * @param el
 */
export function getParentNode(el: VElement | null): ParentNode | null {
  if (!el) return null
  return Array.isArray(el) ? el[0].parentNode : el.parentNode
}
