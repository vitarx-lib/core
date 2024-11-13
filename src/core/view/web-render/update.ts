import { Fragment, isTextVNode, isVNode, type VNode, type VNodeChild } from '../VNode.js'
import { isFunction } from '../../../utils/index.js'
import { removeElement, renderElement, VElementToHTMLElement } from './element.js'
import { removeAttribute, setAttribute } from './attributes.js'
import { renderChild, renderChildren, replaceChild } from './children.js'

/**
 * 差异更新
 *
 * @param oldVNode
 * @param newVNode
 */
export function patchUpdate(oldVNode: VNode, newVNode: VNode): VNode {
  // 类型不一致，替换原有节点
  if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
    // 销毁旧节点作用域
    oldVNode.scope?.destroy()
    // 创建新元素
    const newEl = renderElement(newVNode)
    // 将旧元素替换为新元素
    replaceChild(newEl, oldVNode.el)
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
  // 如果没有旧的子节点
  if (!oldChildren && newChildren) {
    const el = VElementToHTMLElement(oldVNode.el!)
    renderChildren(el, newChildren)
    // 如果是片段节点，则需要将新元素替换到父节点
    if (oldVNode.type === Fragment) {
      // 如果存在父节点，在会挂载在父节点上
      replaceChild(el, oldVNode.el)
    }
    oldVNode.children = newChildren
    return true
  }
  // 如果新子节点为空 则删除旧子节点
  if (!newChildren && oldChildren) {
    oldChildren.forEach(child => destroy(child))
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
    destroy(oldChild)
    return newChild
  }
  // 新增节点
  if (!oldChild && newChild) {
    const container = VElementToHTMLElement(oldVNode.el!)
    renderChild(container, newChild)
    // 挂载到父节点
    if (oldVNode.type === Fragment) {
      replaceChild(container, oldVNode.el)
    }
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
    const newEl = renderElement(newChild)
    replaceChild(newEl, (oldChild as VNode).el!, VElementToHTMLElement(oldVNode.el!) as ParentNode)
    return newChild
  }
}

/**
 * 销毁节点
 *
 * @param vnode - 要销毁的节点
 * @protected
 */
function destroy(vnode: VNodeChild): void {
  if (isVNode(vnode)) {
    vnode.scope?.destroy()
    removeElement(vnode.el)
  } else if (isTextVNode(vnode)) {
    if (vnode.el) vnode.el.remove()
  }
}
