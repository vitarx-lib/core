import { Observer, toRaw } from '@vitarx/responsive'
import { isDeepEqual } from '@vitarx/utils'
import { DomHelper } from '../dom/index.js'
import { isContainerVNode, isNotTagVNode, isVNode, isWidgetVNode } from './guards.js'
import { Fragment } from './node-symbol.js'
import type { ContainerVNode, NoTagVNode, VNode } from './nodes/index.js'

/**
 * VNodeUpdate 是一个用于虚拟DOM节点更新的工具类，提供了虚拟DOM节点的更新、替换等功能。
 *
 * 核心功能包括：
 * - patchUpdate: 更新虚拟DOM节点，处理节点类型、属性和子节点的变更
 * - patchUpdateAttrs: 更新虚拟节点的属性，处理属性的增加、删除和修改
 * - patchUpdateChildren: 更新子节点，处理子节点的增删改查和位置调整
 * - replace: 替换旧节点为新节点，处理不同类型节点的替换逻辑
 *
 * 使用示例：
 * ```typescript
 * // 更新虚拟节点
 * const updatedNode = VNodeUpdate.patchUpdate(oldNode, newNode);
 *
 * // 更新节点属性
 * VNodeUpdate.patchUpdateAttrs(oldNode, newNode);
 *
 * // 更新子节点
 * const newChildren = VNodeUpdate.patchUpdateChildren(containerNode, newContainerNode);
 * ```
 *
 * 构造函数参数：
 * - 该类为静态工具类，无需实例化，所有方法均为静态方法
 *
 * 使用限制：
 * - 需要确保传入的节点参数符合 VNode 类型规范
 * - 在处理节点替换时，需要确保节点已正确挂载到DOM树上
 *
 * 潜在副作用：
 * - 频繁的节点更新可能导致性能问题，建议合理使用节点的key属性以优化更新性能
 * - 在处理节点替换时，会自动调用节点的挂载和卸载钩子，可能会影响组件的生命周期
 */
export class VNodeUpdate {
  /**
   * 用于更新虚拟DOM节点的patch方法
   * @param oldVNode - 旧的虚拟DOM节点
   * @param newVNode - 新的虚拟DOM节点
   * @returns {VNode} 更新后的虚拟DOM节点
   */
  static patchUpdate(oldVNode: VNode, newVNode: VNode): VNode {
    // 如果两个节点相同，则返回旧节点
    if (oldVNode === newVNode) return oldVNode
    // 如果新旧节点的类型或key不同，则替换整个节点
    if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
      // 替换旧节点为新节点
      this.replace(newVNode, oldVNode)
      return newVNode
    } else if (!oldVNode.isStatic) {
      // 更新节点的属性
      this.patchUpdateAttrs(oldVNode, newVNode)
      // 如果是容器节点，则更新其子节点
      if (isContainerVNode(oldVNode)) {
        // 递归更新子节点并获取更新后的子节点列表
        const newChildren = this.patchUpdateChildren(oldVNode, newVNode as ContainerVNode)
        oldVNode.replaceChildren(newChildren)
      }
    }
    return oldVNode
  }
  /**
   * 更新虚拟节点的属性
   * @param oldVNode - 旧的虚拟节点
   * @param newVNode - 新的虚拟节点，必须和旧节点是同类型！！！
   * @template T - 继承自VNode的泛型类型
   */
  static patchUpdateAttrs<T extends VNode>(oldVNode: T, newVNode: T) {
    // 如果是特殊的无props节点，则不进行任何更新
    if (isNotTagVNode(oldVNode)) {
      oldVNode.value = (newVNode as unknown as NoTagVNode<any>).value
      return
    }
    if (oldVNode.type === Fragment) return
    const isWidget = isWidgetVNode(oldVNode) // 判断是否是Widget类型的节点
    const el = oldVNode.element as HTMLElement // 获取DOM元素
    // 旧的属性
    const oldAttrs = toRaw(oldVNode.props) as Record<string, any>
    // 新的属性
    const newAttrs = newVNode.props as Record<string, any>
    const keysToDelete = new Set(Object.keys(oldAttrs)) // 需要删除的属性键集合
    const changedAttrs: string[] = [] // 发生变化的属性数组
    // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
    for (const key in newAttrs) {
      const newValue = newAttrs[key]
      const oldValue = oldAttrs[key]
      // 将存在于新Attrs的键从 keysToDelete 中删除
      keysToDelete.delete(key)
      // 更新或新增属性
      if (oldValue !== newValue || !isDeepEqual(oldValue, newValue)) {
        if (isWidget) {
          if (
            key === 'children' && // 检查是否为children属性
            isVNode(oldValue) && // 检查旧值是否为虚拟节点
            isVNode(newValue) && // 检查新值是否为虚拟节点
            oldValue.type === newValue.type && // 比较虚拟节点的类型是否相同
            oldValue.key === newValue.key // 比较虚拟节点的键是否相同
          ) {
            // 直接更新，跳过通知组件children变化，减少重构次数，提升性能
            this.patchUpdateAttrs(oldValue, newValue)
            if (isContainerVNode(oldValue)) {
              // 递归更新子节点并获取更新后的子节点列表
              const newChildren = this.patchUpdateChildren(oldValue, newValue as ContainerVNode)
              oldValue.replaceChildren(newChildren)
            }
            continue
          }
          changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
        } else {
          DomHelper.setAttribute(el, key, newValue, oldValue) // 设置DOM属性
        }
        oldAttrs[key] = newValue // 更新旧属性值
      }
    }
    // 遍历要删除的键集合，并删除对应的属性
    for (const key of keysToDelete) {
      if (isWidget) {
        changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
      } else {
        DomHelper.removeAttribute(el, key, oldAttrs[key]) // 移除DOM属性
      }
      delete oldAttrs[key] // 删除旧属性
    }
    // 如果有属性值改变，触发属性监听器
    if (changedAttrs.length > 0) Observer.notify(oldVNode.props, changedAttrs)
  }

  /**
   * 更新容器子节点（精简优化版）
   *
   * @param oldVNode - 旧的虚拟节点
   * @param newVNode - 新的虚拟节点，必须和旧的节点类型相同！！！
   */
  static patchUpdateChildren<T extends ContainerVNode>(oldVNode: T, newVNode: T): VNode[] {
    const oldChildren = oldVNode.children
    const newChildren = newVNode.children
    const parentEl = oldVNode.element
    const removedNodes = new Set(oldChildren)
    // === 边界情况 ===
    if (!oldChildren.length) {
      newChildren.forEach(c => c.mount(parentEl))
      return newChildren
    }
    if (!newChildren.length) {
      oldChildren.forEach(c => c.unmount())
      return newChildren
    }
    // === 创建新key映射 ===
    const keyed = new Map<any, VNode>()
    oldChildren.forEach(c => {
      if (c.key || c.key === 0) keyed.set(c.key, c)
    })
    // 要删除的索引
    const toRemove: number[] = []
    // === 主循环：依次处理新子节点 ===
    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i]
      const keyedOldChild = keyed.get(newChild.key) || oldChildren[i]
      // 如果存在于key映射中，直接进行差异化更新
      if (keyedOldChild && keyedOldChild.type === newChild.type) {
        const oldIndex = oldChildren.indexOf(keyedOldChild)
        // 将旧节点复用到新列表中
        newChildren[i] = keyedOldChild
        // 更新旧节点的索引
        oldChildren.splice(oldIndex, 1)
        oldChildren.splice(i, 0, keyedOldChild)
        const anchor = oldChildren[i + 1]?.element
        if (anchor) {
          DomHelper.insertBefore(keyedOldChild.element, anchor)
        } else {
          DomHelper.appendChild(parentEl, keyedOldChild.element)
        }
        // 更新节点的属性
        this.patchUpdate(keyedOldChild, newChild)
        removedNodes.delete(keyedOldChild)
        continue
      }
      const oldChild = oldChildren[i]
      // --- 更新或替换节点 ---
      if (oldChild) {
        const updated = this.patchUpdate(oldChild, newChild)
        if (updated === oldChild) {
          newChildren[i] = oldChild
          removedNodes.delete(oldChild)
        }
        continue
      }
      // --- 新增节点 ---
      const anchor = oldChildren[i + 1]?.element
      newChild.mount(anchor || parentEl, anchor ? 'insertBefore' : 'appendChild')
    }
    // === 卸载未复用节点 ===
    removedNodes.forEach(child => child?.unmount())
    return newChildren
  }

  /**
   * 不同类型节点替换
   *
   * @param newVNode - 新的虚拟节点
   * @param oldVNode - 旧的虚拟节点
   * @return {VNode} 替换后的虚拟节点
   */
  static replace(newVNode: VNode, oldVNode: VNode): VNode {
    const oldElement = oldVNode.teleport ? oldVNode.shadowElement : oldVNode.element
    const shadowElement = document.createTextNode('')
    // 插入影子元素到旧节点之前，兼容卸载动画
    DomHelper.insertBefore(shadowElement, oldElement)
    // 卸载旧节点
    oldVNode.unmount()
    // 挂载新节点
    newVNode.mount(shadowElement, 'replace')
    return newVNode
  }
}
