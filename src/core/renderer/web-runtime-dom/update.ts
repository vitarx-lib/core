import { isFunction } from '../../../utils/index.js'
import { renderChildren, renderElement } from './render.js'
import { removeAttribute, setAttribute } from './attributes.js'
import {
  type ChildVNode,
  Fragment,
  isCommentVNode,
  isTextVNode,
  isVNode,
  isWidgetVNode,
  type VNode,
  type VNodeChildren,
  VNodeManager
} from '../../vnode/index.js'
import {
  createEmptyFragmentPlaceholderNode,
  getElParentNode,
  getVDocumentFragmentFirstEl,
  getVDocumentFragmentLastEl,
  isVDocumentFragment,
  recoveryFragmentChildNodes
} from './utils.js'
import { toRaw } from '../../responsive/index.js'
import { Observers } from '../../observer/index.js'
import type { HtmlElement, VDocumentFragment } from '../types/index.js'

/**
 * 差异更新
 *
 * @param oldVNode - 旧虚拟节点
 * @param newVNode - 新虚拟节点
 * @param [autoMount=true] - 是否自动挂载新节点和卸载旧节点
 * @returns - 新虚拟节点
 */
export function patchUpdate(oldVNode: VNode, newVNode: VNode, autoMount = true): VNode {
  // 类型不一致，替换原有节点
  if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
    // 替换旧节点为新节点
    replaceVNode(newVNode, oldVNode, autoMount)
    return newVNode
  } else {
    // 非片段节点，则进行更新属性
    if (oldVNode.type !== Fragment) {
      patchAttrs(oldVNode, newVNode)
    }
    // 非组件节点，更新子节点
    if (!isFunction(oldVNode.type)) {
      oldVNode.children = patchChildren(oldVNode, newVNode)
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
  const oldAttrs = toRaw(oldVNode.props) as Record<string, any>
  const newAttrs = newVNode.props as Record<string, any>
  // 使用 Set 记录 oldAttrs 中的键，以便在循环中检查需要删除的属性
  const removeKeysSet = new Set(Object.keys(oldAttrs))
  const changeKey: string[] = []
  // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
  for (const key in newAttrs) {
    // 更新或新增属性
    if (oldAttrs[key] !== newAttrs[key]) {
      if (isWidget) {
        changeKey.push(key)
      } else {
        setAttribute(el, key, newAttrs[key], oldAttrs[key])
      }
      oldAttrs[key] = newAttrs[key]
    }
    // 将存在于新Attrs的键从 removeKeysSet 中删除
    removeKeysSet.delete(key)
  }
  // 遍历要删除的键集合，并删除对应的属性
  for (const key of removeKeysSet) {
    if (isWidget) {
      changeKey.push(key)
    } else {
      removeAttribute(el, key, oldAttrs[key])
    }
    delete oldAttrs[key]
  }
  // 如果有属性值改变，触发属性监听器
  if (changeKey.length > 0) Observers.trigger(oldVNode.props, changeKey)
}

/**
 * 差异化更新子节点列表，旧节点和新节点类型必须相同
 *
 * @param oldVNode - 旧虚拟节点
 * @param newVNode - 新虚拟节点
 * @returns - 新虚拟节点的子节点列表
 */
function patchChildren(oldVNode: VNode, newVNode: VNode): VNodeChildren {
  const oldChildren = oldVNode.children!
  const newChildren = newVNode.children!
  /** 是否为片段节点 */
  const isFragment = oldVNode.type === Fragment

  // 处理边缘情况：新增全部子节点或删除全部子节点
  if (newChildren.length && !oldChildren.length) {
    return handleAddAllChildren(oldVNode, newChildren, isFragment)
  }

  if (!newChildren.length && oldChildren.length) {
    return handleRemoveAllChildren(oldVNode, oldChildren, isFragment, newChildren)
  }

  // 创建旧节点的key映射表
  const oldKeyToVNode = createOldKeyToVNodeMap(oldChildren)

  // 被删除的节点
  const removedNodes = new Set(oldVNode.children)
  // 新子节点列表，未挂载！
  const newChildrenNotMounted: ChildVNode[] = []

  // 根据新列表长度开始遍历
  for (let index = 0; index < newChildren.length; index++) {
    // 旧子节点，可能没有旧子节点
    const oldChild = oldVNode.children[index] as ChildVNode | undefined
    // 新子节点
    const newChild = newVNode.children[index]

    // 尝试复用具有相同key的节点
    if (
      tryReuseNodeWithSameKey(
        oldVNode,
        newChild,
        newChildren,
        removedNodes,
        oldKeyToVNode,
        index,
        isFragment
      )
    ) {
      continue
    }

    // 处理新增节点
    if (!oldChild) {
      handleAddNewChild(oldVNode, newChild, newChildrenNotMounted, index, isFragment)
      continue
    }

    // 更新特殊节点：文本节点和注释节点
    if (tryUpdateSpecialNode(oldChild, newChild, newChildren, removedNodes, index)) {
      continue
    }

    // 更新常规虚拟节点
    if (
      tryUpdateRegularNode(
        oldChild,
        newChild,
        newChildren,
        removedNodes,
        newChildrenNotMounted,
        index
      )
    ) {
      continue
    }

    // 替换不同类型的节点
    replaceVNode(newChild!, oldChild!, false)
    newChildrenNotMounted.push(newChild)
  }

  // 清理和挂载
  removedNodes.forEach(vnode => unmountVNode(vnode))
  newChildrenNotMounted.forEach(mountVNode)
  return newChildren
}

/**
 * 处理添加所有子节点的情况（旧节点没有子节点，新节点有子节点）
 *
 * @param oldVNode - 旧虚拟节点
 * @param newChildren - 新子节点列表
 * @param isFragment - 是否为片段节点
 * @returns - 新子节点列表
 */
function handleAddAllChildren(
  oldVNode: VNode,
  newChildren: VNodeChildren,
  isFragment: boolean
): VNodeChildren {
  // 渲染新的子节点
  renderChildren(oldVNode.el as Element, newChildren, true)
  if (isFragment) {
    replaceElement(oldVNode.el as Element, (oldVNode.el as VDocumentFragment).__emptyElement!)
  }
  return newChildren
}

/**
 * 处理删除所有子节点的情况（旧节点有子节点，新节点没有子节点）
 *
 * @param oldVNode - 旧虚拟节点
 * @param oldChildren - 旧子节点列表
 * @param isFragment - 是否为片段节点
 * @param newChildren - 新子节点列表（空列表）
 * @returns - 新子节点列表（空列表）
 */
function handleRemoveAllChildren(
  oldVNode: VNode,
  oldChildren: VNodeChildren,
  isFragment: boolean,
  newChildren: VNodeChildren
): VNodeChildren {
  if (isFragment) {
    // 插入占位空元素
    insertBeforeExactly(
      createEmptyFragmentPlaceholderNode(oldVNode.el as VDocumentFragment),
      oldChildren[0].el!
    )
  }
  for (const oldChild of oldChildren) {
    unmountVNode(oldChild)
  }
  return newChildren
}

/**
 * 创建旧节点的key映射表
 *
 * @param oldChildren - 旧子节点列表
 * @returns - key到节点的映射表
 */
function createOldKeyToVNodeMap(
  oldChildren: VNodeChildren
): Map<any, { index: number; vnode: VNode }> {
  const oldKeyToVNode = new Map<any, { index: number; vnode: VNode }>()
  for (let i = 0; i < oldChildren.length; i++) {
    const child = oldChildren[i]
    if (isVNode(child) && (child.key || child.key === 0)) {
      oldKeyToVNode.set(child.key, { index: i, vnode: child })
    }
  }
  return oldKeyToVNode
}

/**
 * 尝试复用具有相同key的节点
 *
 * @param oldVNode - 旧虚拟节点
 * @param newChild - 新子节点
 * @param newChildren - 新子节点列表
 * @param removedNodes - 要删除的节点集合
 * @param oldKeyToVNode - 旧节点key映射表
 * @param index - 当前处理的索引
 * @param isFragment - 是否为片段节点
 * @returns - 是否成功复用节点
 */
function tryReuseNodeWithSameKey(
  oldVNode: VNode,
  newChild: ChildVNode,
  newChildren: VNodeChildren,
  removedNodes: Set<ChildVNode>,
  oldKeyToVNode: Map<any, { index: number; vnode: VNode }>,
  index: number,
  isFragment: boolean
): boolean {
  if (isVNode(newChild) && oldKeyToVNode.has(newChild.key)) {
    const oldSameKeyChild = oldKeyToVNode.get(newChild.key)!
    if (oldSameKeyChild.vnode.type === newChild.type) {
      // 避免复用节点被删除
      removedNodes.delete(oldSameKeyChild.vnode)
      // 删除映射，一个key只对应一个节点，避免重复的key造成遗漏节点
      oldKeyToVNode.delete(newChild.key)
      // 替换到新节点列表中
      newChildren[index] = oldSameKeyChild.vnode
      // 只更新属性
      patchAttrs(oldSameKeyChild.vnode, newChild)
      const el = oldSameKeyChild.vnode.el!
      // 如果旧父节点是片段节点
      if (isFragment) {
        const preEl = oldVNode.children[index - 1]?.el
        if (preEl) {
          // 往片段节点的最后一个元素之后插入新元素
          insertAfterExactly(el, preEl)
        } else {
          // 不存在前一个元素则代表着是空片段节点，直接用新元素替换掉占位元素
          replaceElement(el, (oldVNode.el as VDocumentFragment).__emptyElement!)
        }
      } else {
        oldVNode.el!.appendChild(el)
      }
      return true
    }
  }
  return false
}

/**
 * 处理添加新子节点
 *
 * @param oldVNode - 旧虚拟节点
 * @param newChild - 新子节点
 * @param newChildrenNotMounted - 未挂载的新子节点列表
 * @param index - 当前处理的索引
 * @param isFragment - 是否为片段节点
 */
function handleAddNewChild(
  oldVNode: VNode,
  newChild: ChildVNode,
  newChildrenNotMounted: ChildVNode[],
  index: number,
  isFragment: boolean
): void {
  // 如果旧父节点是片段节点
  if (isFragment) {
    const el = renderElement(newChild)
    const preEl = oldVNode.children[index - 1]?.el
    if (preEl) {
      // 往片段节点的最后一个元素之后插入新元素
      insertAfterExactly(el, preEl)
    } else {
      // 不存在前一个元素则代表着是空片段节点，直接用新元素替换掉占位元素
      replaceElement(el, (oldVNode.el as VDocumentFragment).__emptyElement!)
    }
  } else {
    // 其他容器父节点直接渲染新的子节点并挂载到父节点
    renderChildren(oldVNode.el!, newChild)
  }
  newChildrenNotMounted.push(newChild)
}

/**
 * 尝试更新特殊节点（文本节点和注释节点）
 *
 * @param oldChild - 旧子节点
 * @param newChild - 新子节点
 * @param newChildren - 新子节点列表
 * @param removedNodes - 要删除的节点集合
 * @param index - 当前处理的索引
 * @returns - 是否成功更新特殊节点
 */
function tryUpdateSpecialNode(
  oldChild: ChildVNode,
  newChild: ChildVNode,
  newChildren: VNodeChildren,
  removedNodes: Set<ChildVNode>,
  index: number
): boolean {
  if (
    (isTextVNode(oldChild) && isTextVNode(newChild)) ||
    (isCommentVNode(oldChild) && isCommentVNode(newChild))
  ) {
    if (oldChild.value !== newChild.value) {
      oldChild.value = newChild.value
      oldChild.el!.nodeValue = newChild.value
    }
    // 取消标记旧节点为删除
    removedNodes.delete(oldChild)
    newChildren[index] = oldChild
    return true
  }
  return false
}

/**
 * 尝试更新常规虚拟节点
 *
 * @param oldChild - 旧子节点
 * @param newChild - 新子节点
 * @param newChildren - 新子节点列表
 * @param removedNodes - 要删除的节点集合
 * @param newChildrenNotMounted - 未挂载的新子节点列表
 * @param index - 当前处理的索引
 * @returns - 是否成功更新常规节点
 */
function tryUpdateRegularNode(
  oldChild: ChildVNode,
  newChild: ChildVNode,
  newChildren: VNodeChildren,
  removedNodes: Set<ChildVNode>,
  newChildrenNotMounted: ChildVNode[],
  index: number
): boolean {
  if (isVNode(oldChild) && isVNode(newChild)) {
    const updatedNewChild = patchUpdate(oldChild, newChild, false)
    // 如果更新后的虚拟节点和旧虚拟节点相同，则取消将旧节点标记为删除
    if (updatedNewChild === oldChild) {
      newChildren[index] = oldChild
      removedNodes.delete(oldChild)
    } else {
      newChildrenNotMounted.push(updatedNewChild)
    }
    return true
  }
  return false
}

/**
 * 往指定元素之后插入一个元素
 *
 * @param {HtmlElement} newElement - 新元素，如果是已挂载过的片段节点，需要执行恢复操作后，再传入其元素实例
 * @param {HtmlElement} targetElement - 目标元素
 * @returns {ParentNode} - 父容器节点
 */
export function insertAfterExactly(
  newElement: HtmlElement,
  targetElement: HtmlElement
): ParentNode {
  if (isVDocumentFragment(targetElement)) {
    targetElement = getVDocumentFragmentLastEl(targetElement)
  }
  const parent = targetElement.parentNode // 获取父节点
  if (parent) {
    const next = targetElement.nextSibling // 获取目标元素的下一个兄弟节点
    if (next) {
      parent.insertBefore(newElement, next) // 插入到目标元素下一个兄弟节点的后面
    } else {
      parent.appendChild(newElement)
    }
  } else {
    throw new Error('无法插入：目标元素没有父节点')
  }
  return parent
}

/**
 * 在旧元素之前插入新元素
 *
 * 兼容`VDocumentFragment`
 *
 * @param {HtmlElement} newEl - 新元素
 * @param {HtmlElement} targetElement - 旧元素
 * @returns {ParentNode} - 父容器节点
 */
export function insertBeforeExactly(newEl: HtmlElement, targetElement: HtmlElement): ParentNode {
  const parent = getElParentNode(targetElement)
  if (!parent) {
    throw new Error('无法插入：目标元素没有父节点')
  }
  if (isVDocumentFragment(targetElement)) {
    parent.insertBefore(newEl, getVDocumentFragmentFirstEl(targetElement))
  } else {
    parent.insertBefore(newEl, targetElement)
  }
  return parent
}

/**
 * 卸载节点
 *
 * @param {ChildVNode} vnode - 要卸载的虚拟节点
 * @param {boolean} removeEl - 是否要从DOM树中移除元素，内部递归时使用，无需外部指定！
 * @internal 内部核心函数，切勿随意调用！
 */
export function unmountVNode(vnode: ChildVNode, removeEl: boolean = true): void {
  if (isVNode(vnode)) {
    if (vnode.instance) {
      vnode.instance['renderer'].unmount(removeEl)
    } else {
      // 递归卸载子级
      vnode.children?.forEach(child => unmountVNode(child, false))
      // 删除元素
      if (removeEl) removeElement(vnode.el!)
    }
  } else if (isTextVNode(vnode) && removeEl) {
    vnode.el?.remove()
  }
  VNodeManager.destroyVNode(vnode)
}

/**
 * 卸载节点
 *
 * @param vnode - 要卸载的虚拟节点
 * @internal 内部核心函数，切勿随意调用！
 */
export function mountVNode(vnode: ChildVNode): void {
  if (isVNode(vnode)) {
    if ('instance' in vnode) {
      // 挂载当前节点
      vnode.instance!['renderer'].mount()
    } else {
      // 递归挂载子级
      vnode.children?.forEach(child => mountVNode(child))
    }
  }
}

/**
 * 替换节点
 *
 * @internal
 * @param {newVNode} newVNode - 新虚拟节点
 * @param {oldVNode} oldVNode - 旧虚拟节点
 * @param {boolean} autoMount - 是否自动挂载新节点和卸载旧节点
 * @internal 内部核心函数，切勿随意调用！
 */
export function replaceVNode(
  newVNode: ChildVNode,
  oldVNode: ChildVNode,
  autoMount: boolean = true
): void {
  // 渲染新节点
  const newEl = renderElement(newVNode)
  // 如果新节点是传送节点则特殊处理
  if (isWidgetVNode(newVNode) && newVNode.instance!['renderer'].teleport) {
    // 新占位节点
    const newShadowElementEl = newVNode.instance!['renderer'].shadowElement
    // 如果旧节点是传送节点
    if (isWidgetVNode(oldVNode) && oldVNode.instance!['renderer'].teleport) {
      // 新节点的占位元素替换旧节点占位元素
      replaceElement(newShadowElementEl, oldVNode.instance!['renderer'].shadowElement)
    } else {
      // 旧节点不是传送节点
      // 将新传送节点占位元素插入到旧节点之前，兼容卸载动画
      insertBeforeExactly(newShadowElementEl, oldVNode.el!)
    }
    if (autoMount) {
      // 卸载旧节点
      unmountVNode(oldVNode)
      // 挂载新节点
      mountVNode(newVNode)
    }
    return
  }
  // 替换文本节点
  if (isTextVNode(oldVNode) || isCommentVNode(oldVNode)) {
    const parent = getElParentNode(oldVNode.el)
    if (!parent) {
      throw new Error('被替换的旧节点未挂载，无法获取其所在的容器元素实例，无法完成替换操作。')
    }
    parent.replaceChild(recoveryFragmentChildNodes(newVNode.el!), oldVNode.el!)
    if (autoMount) mountVNode(newVNode)
    return
  }
  if (oldVNode.instance) {
    // 如果旧节点是传送节点
    if (oldVNode.instance['renderer'].teleport) {
      // 将新元素替换掉旧节点的传送占位元素
      replaceElement(newEl, oldVNode.instance['renderer'].shadowElement)
    } else {
      // 不是占位节点
      // 将新元素插入到旧元素之前，兼容卸载动画
      insertBeforeExactly(newEl, oldVNode.el!)
    }
  } else {
    replaceElement(newEl, oldVNode.el!)
  }
  if (autoMount) {
    // 卸载旧节点
    unmountVNode(oldVNode)
    // 挂载新节点
    mountVNode(newVNode)
  }
}

/**
 * 更新激活状态
 *
 * @internal
 * @param {ChildVNode} vnode - 子节点
 * @param {boolean} activate - 激活为true，停用为false
 * @internal 内部核心函数，切勿随意调用！
 */
export function updateActivateState(vnode: ChildVNode, activate: boolean): void {
  if (isVNode(vnode)) {
    if (vnode.instance) {
      if (activate) {
        vnode.instance['renderer'].activate(false)
      } else {
        vnode.instance['renderer'].deactivate(false)
      }
    } else {
      // 递归激活/停用子节点
      if (vnode.children) {
        for (let i = 0; i < vnode.children.length; i++) {
          updateActivateState(vnode.children[i], activate)
        }
      }
    }
  }
}

/**
 * 删除元素
 *
 * @param {HtmlElement} el - 删除dom元素
 */
export function removeElement(el: HtmlElement): void {
  if (isVDocumentFragment(el)) {
    // 删除旧节点
    el.__remove()
  } else {
    el?.remove()
  }
}

/**
 * 替换节点
 *
 * @param {HTMLElement} newEl - 新元素
 * @param {HTMLElement} oldEl - 旧元素，目标元素
 * @returns {ParentNode} - 父容器节点
 */
export function replaceElement(newEl: HtmlElement, oldEl: HtmlElement): ParentNode {
  if (isVDocumentFragment(oldEl)) {
    // 片段节点弹出第一个元素，用于替换
    const oldFirstEl = getVDocumentFragmentFirstEl(oldEl)
    const parent = oldFirstEl.parentNode
    if (!parent) {
      throw new Error('无法替换：目标元素没有父节点')
    }
    parent.replaceChild(newEl, oldFirstEl)
    // 删除其余元素
    removeElement(oldEl)
    return parent
  } else {
    if (!oldEl.parentNode) {
      throw new Error('无法替换：目标元素没有父节点')
    }
    oldEl.parentNode.replaceChild(newEl, oldEl)
    return oldEl.parentNode
  }
}
