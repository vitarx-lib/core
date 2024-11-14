import { type VNodeChild, type VNodeChildren } from '../VNode.js'
import { type HtmlElement, renderElement } from './element.js'
import { isArray } from '../../../utils/index.js'

/**
 * 挂载子节点列表
 *
 * @param parent
 * @param children
 */
export function renderChildren(parent: HtmlElement, children: VNodeChildren | null): void {
  if (!children) return
  children.forEach(child => renderChild(parent, child))
}

/**
 * 创建并挂载子节点
 *
 * @param parent
 * @param child
 */
export function renderChild(parent: HtmlElement, child: VNodeChild): void {
  if (isArray(child)) {
    renderChildren(parent, child)
  } else {
    const el = renderElement(child)
    parent?.appendChild(el)
  }
}
