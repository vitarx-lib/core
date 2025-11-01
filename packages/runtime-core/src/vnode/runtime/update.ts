import { SubManager, toRaw } from '@vitarx/responsive'
import { useDomAdapter } from '../../host-adapter/index.js'
import type { AnyProps } from '../../types/index.js'
import { ContainerNode, NonElementNode, VNode } from '../base/index.js'
import { StatelessWidgetNode } from '../nodes/index.js'
import {
  isContainerNode,
  isFragmentNode,
  isNonElementNode,
  isStatefulWidgetNode,
  isStatelessWidgetNode
} from '../utils/index.js'

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
    }
    if (!oldVNode.isStatic) {
      // 更新节点的属性
      this.patchUpdateProps(oldVNode, newVNode)
      // 如果是容器节点，则更新其子节点
      if (isContainerNode(oldVNode)) {
        // 递归更新子节点并获取更新后的子节点列表
        oldVNode.children = this.patchUpdateChildren(oldVNode, newVNode as ContainerNode)
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
  static patchUpdateProps<T extends VNode>(oldVNode: T, newVNode: T) {
    // 更新节点的挂载目标
    oldVNode.setTeleport(newVNode.teleport)
    // 更新节点的显示状态
    oldVNode.show = newVNode.show
    // 片段节点不更新
    if (isFragmentNode(oldVNode)) return
    // 如果是特殊的无props节点，则不进行任何更新
    if (isNonElementNode(oldVNode)) {
      oldVNode.value = (newVNode as unknown as NonElementNode<any>).value
      return
    }
    // 有状态组件节点更新属性处理
    if (isStatefulWidgetNode(oldVNode)) {
      this.updateStatefulWidgetNodeProps(oldVNode.props, newVNode.props)
      return
    }
    // 无状态组件节点更新属性处理
    if (isStatelessWidgetNode(oldVNode)) {
      this.updateStatelessWidgetNodeProps(oldVNode, newVNode as unknown as StatelessWidgetNode)
      return
    }
    // 普通的元素节点更新属性处理
    const dom = useDomAdapter()
    // 获取元素节点
    const el = oldVNode.element
    // 旧的属性
    const oldAttrs = toRaw(oldVNode.props) as Record<string, any>
    // 新的属性
    const newAttrs = newVNode.props as Record<string, any>
    const keysToDelete = new Set(Object.keys(oldAttrs)) // 需要删除的属性键集合
    // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
    for (const key in newAttrs) {
      const newValue = newAttrs[key]
      const oldValue = oldAttrs[key]
      // 将存在于新Attrs的键从 keysToDelete 中删除
      keysToDelete.delete(key)
      // 更新或新增属性
      if (oldValue !== newValue) {
        dom.setAttribute(el, key, newValue, oldValue) // 设置DOM属性
        oldAttrs[key] = newValue // 更新旧属性值
      }
    }
    // 遍历要删除的键集合，并删除对应的属性
    for (const key of keysToDelete) {
      dom.removeAttribute(el, key, oldAttrs[key]) // 移除DOM属性
      delete oldAttrs[key] // 删除旧属性
    }
  }
  /**
   * 不同类型节点替换
   *
   * @param newVNode - 新的虚拟节点
   * @param oldVNode - 旧的虚拟节点
   * @return {VNode} 替换后的虚拟节点
   */
  static replace(newVNode: VNode, oldVNode: VNode): VNode {
    const dom = useDomAdapter()
    const oldElement = oldVNode.operationTarget
    const anchorElement = dom.createText('')
    // 插入一个新的锚点元素
    dom.insertBefore(anchorElement, oldElement)
    // 卸载旧节点
    oldVNode.unmount()
    // 新节点执行挂载，使用锚点元素进行替换
    newVNode.mount(anchorElement, 'replace')
    return newVNode
  }
  /**
   * 更新容器子节点
   *
   * @param oldVNode - 旧的虚拟节点
   * @param newVNode - 新的虚拟节点，必须和旧的节点类型相同！！！
   */
  static patchUpdateChildren<T extends ContainerNode>(oldVNode: T, newVNode: T): VNode[] {
    const dom = useDomAdapter()
    const oldChildren = oldVNode.children
    const newChildren = newVNode.children
    const parentEl = oldVNode.element
    const removedNodes = new Set<VNode>()

    // --- 边界情况 ---
    if (!oldChildren.length) {
      for (const newChild of newChildren) {
        newChild.mount(parentEl)
      }
      return newChildren
    }
    if (!newChildren.length) {
      for (const oldChild of oldChildren) {
        oldChild.unmount()
      }
      return newChildren
    }

    // --- 创建 key 映射 ---
    const newKeyed = new Map<any, { vnode: VNode; index: number }>()
    newChildren.forEach((n, i) => {
      if (n.key !== null) newKeyed.set(n.key, { vnode: n, index: i })
    })

    // 保存旧节点在新数组中的位置
    const newIndexToOldIndex = new Array(newChildren.length).fill(-1)

    for (let oldIndex = 0; oldIndex < oldChildren.length; oldIndex++) {
      const oldChild = oldChildren[oldIndex]
      const entry = newKeyed.get(oldChild.key)
      // 按新节点key和旧节点key匹配，找到可复用的旧节点
      if (entry && entry.vnode.type === oldChild.type) {
        newIndexToOldIndex[entry.index] = oldIndex
        removedNodes.delete(oldChild)
        continue
      }
      const newChild = newChildren[oldIndex]
      // 按位置匹配，找到可复用的旧节点
      if (newChild && newChild.type === oldChild.type && newChild.key === oldChild.key) {
        newIndexToOldIndex[oldIndex] = oldIndex
        continue
      }
      removedNodes.add(oldChild)
    }

    // --- 计算 LIS，只保留顺序正确的节点不移动（仅 key 节点） ---
    const seq = this.getLIS(newIndexToOldIndex)
    let seqIndex = seq.length - 1

    // --- 从后向前处理新节点，避免插入影响未处理节点索引 ---
    for (let i = newChildren.length - 1; i >= 0; i--) {
      const oldIndex = newIndexToOldIndex[i]
      const newChild = newChildren[i]
      const reuseChild = oldIndex !== -1 ? oldChildren[oldIndex] : null

      // 下一个元素，用于 insertBefore 或 appendChild
      const nextChild = newChildren[i + 1]
      const anchor = nextChild ? nextChild.operationTarget : null

      if (reuseChild) {
        // --- 节点复用 ---
        this.patchUpdate(reuseChild, newChild)
        newChildren[i] = reuseChild
        // 判断是否在 LIS 中，不在则移动
        if (seqIndex >= 0 && seq[seqIndex] === i) {
          seqIndex-- // 顺序正确，不移动
        } else {
          const element = reuseChild.operationTarget
          if (anchor) {
            dom.insertBefore(element, anchor)
          } else {
            dom.appendChild(parentEl, element)
          }
        }
        continue
      }
      // --- 新增节点 ---
      newChild.mount(anchor || parentEl, anchor ? 'insertBefore' : 'appendChild')
    }

    // --- 卸载未复用节点 ---
    removedNodes.forEach(c => c?.unmount())

    return newChildren
  }
  /**
   * 更新有状态组件节点的属性
   * @param oldProps - 旧的属性对象
   * @param newProps - 新的属性对象
   */
  private static updateStatefulWidgetNodeProps(oldProps: AnyProps, newProps: AnyProps) {
    // 旧的属性
    const oldAttrs = toRaw(oldProps) as Record<string, any>
    // 新的属性
    const newAttrs = newProps as Record<string, any>
    const keysToDelete = new Set(Object.keys(oldAttrs)) // 需要删除的属性键集合
    const changedAttrs: string[] = [] // 发生变化的属性数组
    // 遍历 newAttrs，检查是否有新的属性或属性值需要更新
    for (const key in newAttrs) {
      const newValue = newAttrs[key]
      const oldValue = oldAttrs[key]
      // 将存在于新Attrs的键从 keysToDelete 中删除
      keysToDelete.delete(key)
      // 更新或新增属性
      if (oldValue !== newValue) {
        changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
        oldAttrs[key] = newValue // 更新旧属性值
      }
    }
    // 遍历要删除的键集合，并删除对应的属性
    for (const key of keysToDelete) {
      changedAttrs.push(key) // 如果是Widget类型的节点，记录变化的属性
      delete oldAttrs[key] // 删除旧属性
    }
    // 如果有属性值改变，触发属性监听器
    if (changedAttrs.length > 0) {
      SubManager.notify(oldProps as Record<string, any>, changedAttrs)
    }
  }
  /**
   * 更新无状态组件节点属性的静态方法
   * @param oldNode - 旧的StatelessWidgetNode节点
   * @param newNode - 新的StatelessWidgetNode节点
   */
  private static updateStatelessWidgetNodeProps(
    oldNode: StatelessWidgetNode,
    newNode: StatelessWidgetNode
  ) {
    // 获取旧节点和新节点的属性
    const oldAttrs = oldNode.props
    const newAttrs = newNode.props
    // 获取所有键的并集
    const allKeys = new Set([...Object.keys(oldAttrs), ...Object.keys(newAttrs)])

    // 使用 Array.some 进行短路求值，找到第一个不同的属性就返回
    const isSomeDifferentProps = Array.from(allKeys).some(key => {
      const newValue = newAttrs[key]
      const oldValue = oldAttrs[key]
      // 处理 undefined 和不存在的键的情况
      const newHasProp = key in newAttrs
      const oldHasProp = key in oldAttrs
      // 如果存在性不同，或者值不同，则认为有变化
      return newHasProp !== oldHasProp || newValue !== oldValue
    })
    // 如果有属性值改变，更新属性
    if (isSomeDifferentProps) oldNode.updateProps(newAttrs)
  }
  /**
   * 获取最长递增子序列（LIS）
   *
   * @param arr 数组，其中 -1 表示该位置没有旧节点，其余数字表示旧节点在旧数组中的索引
   * @returns {number[]} 返回 LIS 的索引列表（基于 arr 的下标）
   */
  private static getLIS(arr: number[]): number[] {
    const p = arr.slice() // 用于回溯每个元素前一个元素在 LIS 中的位置
    const result: number[] = [] // 存放 LIS 的索引（基于 arr 的下标）
    let u: number, v: number, c: number

    // 遍历 arr 中的每一个元素，构建 result
    for (let i = 0; i < arr.length; i++) {
      const arrI = arr[i]
      if (arrI === -1) continue // -1 表示不存在旧节点，跳过
      // 如果 result 为空，或者当前元素比 LIS 最后一个元素大，直接加入 LIS
      if (result.length === 0 || arr[result[result.length - 1]] < arrI) {
        // 记录当前元素的前驱索引，用于后续回溯
        p[i] = result.length > 0 ? result[result.length - 1] : -1
        result.push(i) // 将当前索引加入 LIS
        continue
      }

      // 否则，当前元素需要在 result 中找到合适位置，用二分法替换
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0 // 取中间索引
        if (arr[result[c]] < arrI) u = c + 1
        else v = c
      }

      // 替换 LIS 中的元素，使 LIS 保持最小尾元素特性
      if (arrI < arr[result[u]]) {
        if (u > 0) p[i] = result[u - 1] // 记录前驱元素索引
        result[u] = i // 替换 LIS 中的元素索引
      }
    }

    // 回溯 LIS，生成最终的索引序列
    u = result.length
    v = result[u - 1] // LIS 最后一个元素的索引
    const seq: number[] = new Array(u) // 存放最终 LIS 的下标
    while (u-- > 0) {
      seq[u] = v
      v = p[v] // 回溯到前一个元素
    }

    return seq
  }
}
