import { SubManager, toRaw } from '@vitarx/responsive'
import { useDomAdapter } from '../../host-adapter/index.js'
import type { AnyProps, HostElement } from '../../types/index.js'
import { ContainerNode, NonElementNode, VNode } from '../base/index.js'
import { NodeState } from '../constants/index.js'
import { StatelessWidgetNode } from '../nodes/index.js'
import {
  isContainerNode,
  isFragmentNode,
  isNonElementNode,
  isStatefulWidgetNode,
  isStatelessWidgetNode
} from '../utils/index.js'

export interface ChildNodeUpdateHooks {
  /**
   * 挂载一个子节点
   *
   * @param child - 已被挂载的子节点
   */
  onMount?: (child: VNode) => void
  /**
   * 移动一个子节点
   *
   * @param child - 已被移动的子节点
   */
  onMove?: (child: VNode) => void
  /**
   * 卸载一个子节点
   *
   * @param child - 要卸载的子节点
   * @param done - 完成回调函数，务必调用！
   */
  onUnmount?: (child: VNode, done: () => void) => void
  /**
   * 更新两个子节点
   *
   * @param oldChild - 旧节点
   * @param newChild - 新节点
   * @param done - 完成回调函数，务必调用！
   */
  onUpdate?: (oldChild: VNode, newChild: VNode, done: () => void) => void
}
/**
 * VNode 更新管理器
 *
 * 负责处理虚拟节点(VNode)的更新、替换和子节点管理等操作。
 * 实现了高效的 diff 算法，以最小化 DOM 操作。
 */
export class VNodeUpdate {
  /**
   * 比较并更新两个虚拟节点
   *
   * 根据节点的类型和 key 决定是更新还是替换节点。
   * 如果类型和 key 相同，则更新节点；否则替换节点。
   *
   * @param currentVNode - 当前的虚拟节点
   * @param nextVNode - 新的虚拟节点
   * @returns {VNode} 更新后的虚拟节点
   */
  static patch(currentVNode: VNode, nextVNode: VNode): VNode {
    // 如果类型或 key 不同，需要替换节点
    if (currentVNode.type !== nextVNode.type || currentVNode.key !== nextVNode.key) {
      this.replace(currentVNode, nextVNode)
      return nextVNode
    }

    // 类型相同，更新节点
    this.patchUpdateNode(currentVNode, nextVNode)
    return currentVNode
  }

  /**
   * 更新节点的属性和子节点
   *
   * 静态节点会忽略更新。
   * 对于非静态节点，更新其属性和子节点,
   * 如果是容器节点，则递归更新其子节点。
   *
   * @template T - VNode 的子类型
   * @param currentVNode - 当前的虚拟节点
   * @param nextVNode - 新的虚拟节点
   * @param [skipShow=false] - 是否跳过显示状态的更新
   */
  static patchUpdateNode<T extends VNode>(currentVNode: T, nextVNode: T, skipShow = false): void {
    // 如果是同一个节点引用，直接返回
    if (currentVNode === nextVNode) return
    // 静态节点不需要更新
    if (currentVNode.isStatic) return
    // 更新节点属性
    this.patchUpdateProps(currentVNode, nextVNode, skipShow)

    // 如果是容器节点，更新子节点
    if (isContainerNode(currentVNode)) {
      currentVNode.children = this.patchUpdateChildren(
        currentVNode,
        nextVNode as unknown as ContainerNode
      )
    }
  }
  /**
   * 更新虚拟节点的属性
   *
   * 根据节点类型的不同，采用不同的属性更新策略：
   * - 片段节点：只更新基本属性
   * - 非元素节点：更新值
   * - 有状态组件节点：更新状态属性
   * - 无状态组件节点：更新组件属性
   * - 普通元素节点：更新 DOM 属性
   *
   * @template T - VNode 的子类型
   * @param currentVNode - 当前的虚拟节点
   * @param nextVNode - 新的虚拟节点
   * @param [skipShow=false] - 是否跳过显示状态的更新
   */
  static patchUpdateProps<T extends VNode>(currentVNode: T, nextVNode: T, skipShow = false) {
    // 更新基本属性
    currentVNode.setTeleport(nextVNode.teleport)
    if (!skipShow) currentVNode.show = nextVNode.show

    // 片段节点不需要更新其他属性
    if (isFragmentNode(currentVNode)) return

    // 处理非元素节点
    if (isNonElementNode(currentVNode)) {
      ;(currentVNode as NonElementNode<any>).value = (
        nextVNode as unknown as NonElementNode<any>
      ).value
      return
    }

    // 处理有状态组件节点
    if (isStatefulWidgetNode(currentVNode)) {
      this.updateStatefulProps(currentVNode.props, nextVNode.props)
      return
    }

    // 处理无状态组件节点
    if (isStatelessWidgetNode(currentVNode)) {
      this.updateStatelessProps(
        currentVNode as StatelessWidgetNode,
        nextVNode as unknown as StatelessWidgetNode
      )
      return
    }

    // 处理普通元素节点
    const dom = useDomAdapter()
    const el = currentVNode.element as HostElement
    const oldProps = toRaw(currentVNode.props) as Record<string, any>
    const newProps = nextVNode.props as Record<string, any>
    this.updateElementProps(el, oldProps, newProps, dom)
  }

  /**
   * 用新节点替换旧节点
   *
   * 根据旧节点的挂载状态，采用不同的替换策略：
   * - 如果旧节点已挂载到 DOM，创建锚点元素并替换
   * - 如果旧节点处于已渲染状态但没有父元素，先卸载再挂载新节点
   * - 其他情况抛出错误
   *
   * @param currentVNode - 要被替换的旧节点
   * @param nextVNode - 用于替换的新节点
   * @throws {Error} 当旧节点未挂载且无法替换时抛出错误
   */
  static replace(currentVNode: VNode, nextVNode: VNode) {
    const dom = useDomAdapter()
    const oldElement = currentVNode.operationTarget

    // 如果旧节点有父元素，则创建锚点进行替换
    if (dom.getParentElement(oldElement)) {
      const anchorElement = dom.createText('')
      dom.insertBefore(anchorElement, oldElement)
      currentVNode.unmount()
      nextVNode.mount(anchorElement, 'replace')
    }
    // 如果旧节点处于已渲染状态但没有父元素，直接卸载并挂载新节点
    else if (currentVNode.state === NodeState.Rendered) {
      currentVNode.unmount()
      nextVNode.mount()
    }
    // 其他情况无法替换，抛出错误
    else {
      throw new Error('VNodeUpdate.replace(): the old node is not mounted and cannot be replaced')
    }
  }

  /**
   * 更新容器节点的子节点
   *
   * 实现了高效的子节点 diff 算法，通过 key 匹配和最长递增子序列(LIS)优化，
   * 最小化 DOM 操作，提高性能。
   *
   * 处理流程：
   * 1. 处理边界情况：旧子节点为空或新子节点为空
   * 2. 通过 key 匹配新旧子节点
   * 3. 计算最长递增子序列，确定需要移动的节点
   * 4. 从后向前遍历新子节点，复用、移动或创建节点
   * 5. 卸载不再需要的旧节点
   *
   * @param parent - 父容器节点
   * @param nextVNode - 包含新子节点的虚拟节点
   * @param hooks - 更新钩子函数
   * @returns {VNode[]} 更新后的子节点数组
   */
  static patchUpdateChildren(
    parent: ContainerNode,
    nextVNode: ContainerNode,
    hooks?: ChildNodeUpdateHooks
  ): VNode[] {
    const dom = useDomAdapter()
    const oldChildren = parent.children
    const newChildren = nextVNode.children
    const parentEl = parent.element
    // 获取更新钩子函数
    const onMount = typeof hooks?.onMount === 'function' ? hooks.onMount : undefined
    // 边界情况：旧子节点为空，直接挂载所有新子节点
    if (!oldChildren.length) {
      if (onMount) {
        for (const child of newChildren) {
          child.mount(parentEl)
          onMount(child)
        }
      } else {
        for (const child of newChildren) child.mount(parentEl)
      }
      return newChildren
    }
    // 获取更新钩子函数
    const onUnmount = typeof hooks?.onUnmount === 'function' ? hooks.onUnmount : undefined
    // 边界情况：新子节点为空，直接卸载所有旧子节点
    if (!newChildren.length) {
      if (onUnmount) {
        for (const child of oldChildren) {
          onUnmount(child, () => child.unmount())
        }
      } else {
        for (const child of oldChildren) child.unmount()
      }
      return newChildren
    }
    // 通过 key 匹配新旧子节点，获取映射关系和需要移除的节点
    const { newIndexToOldIndex, removedNodes } = this.matchChildrenByKey(oldChildren, newChildren)

    // 计算最长递增子序列，用于优化节点移动操作
    const seq = this.getLIS(newIndexToOldIndex)
    let seqIndex = seq.length - 1
    // 获取移动钩子函数
    const onMove = typeof hooks?.onMove === 'function' ? hooks.onMove : undefined
    // 获取更新钩子函数
    const onUpdate = typeof hooks?.onUpdate === 'function' ? hooks.onUpdate : undefined
    // 从后向前遍历新子节点，处理复用、移动和创建
    for (let i = newChildren.length - 1; i >= 0; i--) {
      const oldIndex = newIndexToOldIndex[i]
      const newChild = newChildren[i]
      const anchor = newChildren[i + 1]?.operationTarget || null

      // 如果旧节点中有匹配的节点，则复用
      if (oldIndex !== -1) {
        const reuseChild = oldChildren[oldIndex]
        if (onUpdate) {
          onUpdate(reuseChild, newChild, () => this.patchUpdateNode(reuseChild, newChild))
        } else {
          // 更新节点
          this.patchUpdateNode(reuseChild, newChild)
        }
        newChildren[i] = reuseChild

        // 检查是否需要移动节点
        if (seqIndex >= 0 && seq[seqIndex] === i) {
          seqIndex--
        } else {
          // 节点移动到新位置
          dom.insertBefore(reuseChild.operationTarget, anchor)
          onMove?.(reuseChild) // 💡 移动钩子在真实 DOM 移动后触发
        }
        continue
      }

      // 没有匹配的旧节点，创建新节点
      newChild.mount(anchor || parentEl, anchor ? 'insertBefore' : 'appendChild')
      onMount?.(newChild)
    }

    if (onUnmount) {
      for (const removedNode of removedNodes) {
        onUnmount(removedNode, () => removedNode.unmount())
      }
    } else {
      // 卸载不再需要的旧节点
      for (const removedNode of removedNodes) {
        removedNode.unmount()
      }
    }

    return newChildren
  }

  /**
   * 比较两个属性对象，找出变化的属性
   *
   * 通过比较新旧属性对象，确定哪些属性发生了变化，
   * 以及哪些属性需要被删除。返回包含这些信息的对象。
   *
   * @param oldProps - 旧的属性对象
   * @param newProps - 新的属性对象
   * @returns {Object} 包含 changedKeys（变化的属性）和 keysToDelete（需要删除的属性）的对象
   */
  private static diffProps(
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ): { changedKeys: string[]; keysToDelete: Set<string> } {
    // 初始化需要删除的属性集合（初始为所有旧属性）
    const keysToDelete = new Set(Object.keys(oldProps))
    // 初始化变化的属性数组
    const changedKeys: string[] = []

    // 遍历新属性，找出变化的属性
    for (const key in newProps) {
      const newValue = newProps[key]
      const oldValue = oldProps[key]
      // 从删除集合中移除（因为新属性中存在）
      keysToDelete.delete(key)
      // 如果值不同，则添加到变化列表
      if (oldValue !== newValue) changedKeys.push(key)
    }

    // 将剩余的需要删除的属性也添加到变化列表
    for (const key of keysToDelete) changedKeys.push(key)

    return { changedKeys, keysToDelete }
  }

  /**
   * 更新 DOM 元素的属性
   *
   * 根据属性变化情况，更新或删除 DOM 元素的属性。
   * 首先通过 diffProps 找出变化的属性，然后分别处理更新和删除操作。
   *
   * @param el - 要更新的 DOM 元素
   * @param oldProps - 旧的属性对象
   * @param newProps - 新的属性对象
   * @param dom - DOM 适配器实例
   */
  private static updateElementProps(
    el: HostElement,
    oldProps: Record<string, any>,
    newProps: Record<string, any>,
    dom: ReturnType<typeof useDomAdapter>
  ): void {
    // 找出变化的属性和需要删除的属性
    const { changedKeys, keysToDelete } = this.diffProps(oldProps, newProps)

    // 处理更新或新增的属性
    for (const key of changedKeys) {
      if (key in newProps) {
        // 更新 DOM 属性
        dom.setAttribute(el, key, newProps[key], oldProps[key])
        // 更新属性对象
        oldProps[key] = newProps[key]
      }
    }

    // 处理需要删除的属性
    for (const key of keysToDelete) {
      if (!(key in newProps)) {
        // 从 DOM 中移除属性
        dom.removeAttribute(el, key, oldProps[key])
        // 从属性对象中删除
        delete oldProps[key]
      }
    }
  }

  /**
   * 更新有状态组件的属性
   *
   * 处理有状态组件的属性更新，包括更新属性值和通知响应式系统。
   * 首先找出变化的属性，然后更新旧属性对象，最后通知订阅者。
   *
   * @param oldProps - 旧的属性对象
   * @param newProps - 新的属性对象
   */
  private static updateStatefulProps(oldProps: AnyProps, newProps: AnyProps): void {
    // 获取原始属性对象（非响应式）
    const oldRaw = toRaw(oldProps) as Record<string, any>
    const newRaw = newProps as Record<string, any>
    // 找出变化的属性
    const { changedKeys } = this.diffProps(oldRaw, newRaw)

    // 更新旧属性
    for (const key of changedKeys) {
      if (key in newRaw) oldRaw[key] = newRaw[key]
      else delete oldRaw[key]
    }

    // 如果有属性变化，通知响应式系统
    if (changedKeys.length > 0) SubManager.notify(oldProps as Record<string, any>, changedKeys)
  }

  /**
   * 更新无状态组件的属性
   *
   * 检查无状态组件的属性是否发生变化，如果有变化则调用组件的更新方法。
   * 通过比较新旧属性的所有键值对来确定是否需要更新。
   *
   * @param node - 无状态组件节点
   * @param newProps - 新的属性对象
   */
  private static updateStatelessProps(node: StatelessWidgetNode, newProps: AnyProps): void {
    const oldProps = node.props
    // 获取所有属性的键的并集
    const allKeys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
    // 检查是否有属性值发生变化
    const isChanged = Array.from(allKeys).some(key => oldProps[key] !== newProps[key])

    // 如果有变化，更新组件属性
    if (isChanged) node.updateProps(newProps)
  }

  /**
   * 通过 key 匹配新旧子节点
   *
   * 实现了高效的子节点匹配算法，用于确定哪些节点可以复用，
   * 哪些节点需要移除，以及新旧节点之间的映射关系。
   *
   * 匹配策略：
   * 1. 首先建立新子节点的 key 映射表
   * 2. 遍历旧子节点，尝试在新子节点中找到匹配
   * 3. 对于有 key 的节点，通过 key 匹配
   * 4. 对于没有 key 的节点，通过索引匹配
   * 5. 未匹配的旧节点将被标记为需要移除
   *
   * @param oldChildren - 旧的子节点数组
   * @param newChildren - 新的子节点数组
   * @returns {Object} 包含 newIndexToOldIndex（新旧节点索引映射）和 removedNodes（需要移除的节点）的对象
   */
  private static matchChildrenByKey(
    oldChildren: VNode[],
    newChildren: VNode[]
  ): { newIndexToOldIndex: number[]; removedNodes: VNode[] } {
    // 建立新子节点的 key 映射表
    const newKeyedMap = new Map<any, { vnode: VNode; index: number }>()
    for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i]
      if (newChild.key !== undefined) {
        newKeyedMap.set(newChild.key, { vnode: newChild, index: i })
      }
    }

    // 初始化新旧节点索引映射数组（-1 表示没有匹配）
    const newIndexToOldIndexMap = new Array(newChildren.length).fill(-1)
    // 初始化需要移除的节点集合
    const removedNodesSet: VNode[] = []

    // 遍历旧子节点，尝试在新子节点中找到匹配
    for (let oldIndex = 0; oldIndex < oldChildren.length; oldIndex++) {
      const oldChild = oldChildren[oldIndex]

      // 处理有 key 的节点
      if (oldChild.key !== undefined) {
        const matchedEntry = newKeyedMap.get(oldChild.key)
        // 找到匹配且类型相同
        if (matchedEntry && matchedEntry.vnode.type === oldChild.type) {
          // 记录新旧索引映射关系
          newIndexToOldIndexMap[matchedEntry.index] = oldIndex
          continue
        }
      }
      // 处理没有 key 的节点
      else {
        const newChild = newChildren[oldIndex]
        // 相同索引位置且类型相同
        if (newChild && newChild.type === oldChild.type && newChild.key === undefined) {
          newIndexToOldIndexMap[oldIndex] = oldIndex
          continue
        }
      }

      // 未匹配的节点需要移除
      removedNodesSet.push(oldChild)
    }

    return { newIndexToOldIndex: newIndexToOldIndexMap, removedNodes: removedNodesSet }
  }

  /**
   * 计算最长递增子序列 (Longest Increasing Subsequence, LIS)
   *
   * 使用优化的 O(n log n) 算法计算数组的最长递增子序列。
   * 这个算法在子节点更新中用于确定哪些节点不需要移动，
   从而最小化 DOM 操作，提高性能。
   *
   * 算法步骤：
   * 1. 遍历数组，构建递增序列
   * 2. 使用二分查找确定插入位置
   * 3. 记录前驱节点关系
   * 4. 回溯构建最终序列
   *
   * @param arr - 输入数组，包含 -1 表示无效位置
   * @returns {number[]} 最长递增子序列的索引数组
   */
  private static getLIS(arr: number[]): number[] {
    // p 数组记录每个位置的前驱节点索引
    const p = arr.slice()
    // result 数组记录当前递增序列的末尾索引
    const result: number[] = []
    let u: number, v: number, c: number

    // 遍历输入数组
    for (let i = 0; i < arr.length; i++) {
      const arrI = arr[i]
      // 跳过无效位置
      if (arrI === -1) continue

      // 如果结果数组为空或当前元素大于结果数组末尾元素，直接追加
      if (result.length === 0 || arr[result[result.length - 1]] < arrI) {
        p[i] = result.length > 0 ? result[result.length - 1] : -1
        result.push(i)
        continue
      }

      // 使用二分查找确定插入位置
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0 // 向下取整
        if (arr[result[c]] < arrI) u = c + 1
        else v = c
      }

      // 如果当前元素可以替换结果数组中的某个元素
      if (arrI < arr[result[u]]) {
        if (u > 0) p[i] = result[u - 1]
        result[u] = i
      }
    }

    // 回溯构建最终序列
    u = result.length
    v = result[u - 1]
    const seq: number[] = new Array(u)
    while (u-- > 0) {
      seq[u] = v
      v = p[v]
    }
    return seq
  }
}
