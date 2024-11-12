import { type VElement, type VNodeChild, type VNodeChildren } from '../VNode.js'
import { type HtmlElement, removeElement, renderElement, VElementToHTMLElement } from './element.js'

/**
 * 挂载子节点列表
 *
 * @param parent
 * @param children
 */
export function createChildren(parent: HtmlElement, children: VNodeChildren | undefined): void {
  if (!children) return
  children.forEach(child => createChild(parent, child))
}

/**
 * 创建并挂载子节点
 *
 * @param parent
 * @param child
 */
export function createChild(parent: HtmlElement, child: VNodeChild): void {
  parent.appendChild(renderElement(child))
}

/**
 * 替换节点
 *
 * @param newEl
 * @param oldEl
 * @param parent - 不传入父节点，自动使用旧节点的父节点
 */
export function replaceChild(
  newEl: VElement | HtmlElement,
  oldEl: VElement | null,
  parent?: ParentNode | null
): void {
  // 如果没有旧节点，或父节点不存在，则不处理
  if (!oldEl || parent === null) return
  if (parent === undefined) {
    parent = getParentNode(oldEl)
  }
  if (!parent) return
  if (Array.isArray(oldEl)) {
    // 片段节点弹出第一个元素，用于替换
    const old = oldEl.shift()!
    // 删除其余元素
    removeElement(oldEl)
    parent.replaceChild(VElementToHTMLElement(newEl), old)
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
