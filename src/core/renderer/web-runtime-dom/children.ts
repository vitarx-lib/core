import { renderElement } from './render.js'
import type { VNodeChild, VNodeChildren } from '../../vnode/index.js'
import { ContainerElement } from './type.js'
import { mountVNode } from './update.js'

/**
 * 挂载子节点列表
 *
 * @param {ContainerElement} parent - 父元素
 * @param {VNodeChildren} children - 子节点列表
 * @param {boolean} triggerMountHook - 自动触发挂载钩子
 */
export function renderChildren(
  parent: ContainerElement,
  children: VNodeChildren | VNodeChild | null,
  triggerMountHook: boolean = false
): void {
  if (!children) return
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
