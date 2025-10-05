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
 * const updatedNode = VNodeHelper.patchUpdate(oldNode, newNode);
 *
 * // 更新节点属性
 * VNodeHelper.patchUpdateAttrs(oldNode, newNode);
 *
 * // 更新子节点
 * const newChildren = VNodeHelper.patchUpdateChildren(containerNode, newContainerNode);
 * ```
 *
 * 构造函数参数：
 * - 该类为静态工具类，无需实例化，所有方法均为静态方法
 *
 * 使用限制：
 * - 需要确保传入的节点参数符合 VNode 类型规范
 * - 在处理节点替换时，需要确保节点已正确挂载到DOM树上
 * - 对于传送节点(teleport)有特殊的处理逻辑，需要特别注意其占位元素的处理
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
   * @param autoMount - 是否自动挂载，默认为true
   * @returns {VNode} 更新后的虚拟DOM节点
   */
  static patchUpdate(oldVNode: VNode, newVNode: VNode, autoMount = true): VNode {
    // 如果两个节点相同，则返回旧节点
    if (oldVNode === newVNode) return oldVNode
    // 如果新旧节点的类型或key不同，则替换整个节点
    if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
      // 替换旧节点为新节点
      this.replace(newVNode, oldVNode, autoMount)
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
   * 更新子节点的核心方法
   * @param oldVNode - 旧的虚拟DOM节点
   * @param newVNode - 新的虚拟DOM节点
   * @returns {VNode[]} 更新后的子节点数组
   */
  static patchUpdateChildren<T extends ContainerVNode>(oldVNode: T, newVNode: T): VNode[] {
    const oldChildren = oldVNode.children // 旧子节点列表
    const newChildren = newVNode.children // 新子节点列表

    // 处理边缘情况：新增全部子节点
    if (newChildren.length && !oldChildren.length) {
      newChildren.forEach(child => {
        child.mount(oldVNode.element) // 挂载所有新子节点
      })
      return newChildren // 返回新子节点列表
    }
    // 删除全部子节点
    if (!newChildren.length && oldChildren.length) {
      oldChildren.forEach(child => {
        child.unmount()
      })
      return newChildren // 返回空的新子节点列表
    }

    // 创建旧节点的key映射表，用于快速查找具有相同key的节点
    const oldKeyToVNode = this.#createOldKeyToVNodeMap(oldChildren)

    // 被删除的节点集合
    const removedNodes = new Set(oldVNode.children)
    // 根据新列表长度开始遍历
    for (let index = 0; index < newChildren.length; index++) {
      // 旧子节点，可能没有旧子节点
      const oldChild = oldVNode.children[index] as VNode | undefined
      // 新子节点
      const newChild = newVNode.children[index]
      const oldSameKeyChild = oldKeyToVNode.get(newChild.key)
      // 复用相同key节点
      if (oldSameKeyChild && oldSameKeyChild.vnode.type === newChild.type) {
        // 避免复用节点被卸载
        removedNodes.delete(oldSameKeyChild.vnode)
        // 删除映射，一个key只对应一个节点，避免重复的key造成遗漏节点
        oldKeyToVNode.delete(newChild.key)
        // 替换到新节点列表中，保持顺序
        newChildren[index] = oldSameKeyChild.vnode
        // 把新节点属性，更新到旧节点之上
        this.patchUpdateAttrs(oldSameKeyChild.vnode, newChild)
        continue
      }
      // 处理新增 / 替换
      if (oldChild) {
        // 替换节点
        const updatedNewChild = this.patchUpdate(oldChild, newChild, false)
        // 复用了旧节点，将旧节点替换到新节点列表中
        if (updatedNewChild === oldChild) {
          newChildren[index] = oldChild
          removedNodes.delete(oldChild)
        }
      }
    }

    // 卸载所有被删除的节点
    removedNodes.forEach(vnode => vnode.unmount())
    // 重新遍历节点列表，重新进行挂载
    newChildren.forEach(vnode => {
      if (isWidgetVNode(vnode) && vnode.state !== 'notMounted') {
        DomHelper.appendChild(oldVNode.element, vnode.element)
      } else {
        vnode.mount(oldVNode.element, 'appendChild')
      }
    })
    return newChildren
  }

  /**
   * 不同类型节点替换
   *
   * @param newVNode - 新的虚拟节点
   * @param oldVNode - 旧的虚拟节点
   * @param [autoMount=true] - 自动触发挂载钩子
   * @return {VNode} 替换后的虚拟节点
   */
  static replace(newVNode: VNode, oldVNode: VNode, autoMount: boolean = true): VNode {
    const oldElement = oldVNode.teleport ? oldVNode.shadowElement : oldVNode.element
    const shadowElement = document.createTextNode('')
    // 插入影子元素到旧节点之前，兼容卸载动画
    DomHelper.insertBefore(shadowElement, oldElement)
    if (autoMount) {
      // 卸载旧节点
      oldVNode.unmount()
      // 挂载新节点
      newVNode.mount(shadowElement, 'replace')
    }
    return newVNode
  }

  /**
   * 创建旧节点的key映射表
   *
   * @param oldChildren - 旧子节点列表
   * @returns - key到节点的映射表
   */
  static #createOldKeyToVNodeMap(oldChildren: VNode[]): Map<any, { index: number; vnode: VNode }> {
    const oldKeyToVNode = new Map<any, { index: number; vnode: VNode }>()
    for (let i = 0; i < oldChildren.length; i++) {
      const child = oldChildren[i]
      if (child.key || child.key === 0) {
        oldKeyToVNode.set(child.key, { index: i, vnode: child })
      }
    }
    return oldKeyToVNode
  }
}
