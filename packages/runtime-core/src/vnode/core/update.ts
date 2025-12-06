import { NodeState } from '../../constants/index.js'
import { diffDirectives, type DiffDirectivesOptions } from '../../directive/index.js'
import { getRenderer } from '../../renderer/index.js'
import type { ContainerNode, ElementNode, VNode, WidgetNode } from '../../types/index.js'
import { getDomTarget, isContainerNode, isElementNode, isWidgetNode } from '../../utils/index.js'
import { mountNode, renderNode, unmountNode, updateNodeProps } from './driver.js'

export interface ChildNodeUpdateHooks {
  /**
   * 挂载一个子节点
   *
   * @param child - 已被挂载的子节点
   */
  onMount?: (child: VNode) => void
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
export class PatchUpdate {
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
    // 如果两个节点相同，则返回旧节点
    if (currentVNode === nextVNode) return currentVNode
    if (currentVNode.state === NodeState.Created) return nextVNode
    if (currentVNode.type !== nextVNode.type || currentVNode.key !== nextVNode.key) {
      // 如果类型或 key 不同，需要替换节点
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
   * @param options -  diff 指令选项
   */
  static patchUpdateNode<T extends VNode>(
    currentVNode: T,
    nextVNode: T,
    options?: DiffDirectivesOptions
  ): void {
    // 如果是同一个节点引用，直接返回
    if (currentVNode === nextVNode) return
    // 静态节点不需要更新
    if (currentVNode.static) return
    if (isWidgetNode(currentVNode)) {
      if (isElementNode(currentVNode.instance!.child)) {
        diffDirectives(currentVNode, nextVNode as WidgetNode, options)
      }
    } else if (isElementNode(currentVNode)) {
      //  diff 指令
      diffDirectives(currentVNode, nextVNode as unknown as ElementNode, options)
    }
    // 更新节点属性
    this.patchUpdateProps(currentVNode, nextVNode)
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
   */
  static patchUpdateProps<T extends VNode>(currentVNode: T, nextVNode: T) {
    updateNodeProps(currentVNode, nextVNode.props)
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
  static replace(currentVNode: VNode, nextVNode: VNode): VNode {
    if (currentVNode.state === NodeState.Rendered) {
      renderNode(nextVNode)
    } else if (currentVNode.state === NodeState.Activated) {
      const oldElement = getDomTarget(currentVNode)
      mountNode(nextVNode, oldElement, 'insertBefore')
    }
    unmountNode(currentVNode)
    return nextVNode
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
   * @param currentNode - 当前容器节点
   * @param nextVNode - 包含新子节点的容器节点
   * @param hooks - 更新钩子函数
   * @returns {VNode[]} 更新后的子节点数组
   */
  static patchUpdateChildren(
    currentNode: ContainerNode,
    nextVNode: ContainerNode,
    hooks?: ChildNodeUpdateHooks
  ): VNode[] {
    const dom = getRenderer()
    const oldChildren = currentNode.children
    const newChildren = nextVNode.children
    const parentEl = currentNode.el
    if (!parentEl) {
      throw new Error('NodeUpdate.patchUpdateChildren() currentNode el is undefined')
    }
    const onMount = hooks?.onMount
    const onUnmount = hooks?.onUnmount
    const onUpdate = hooks?.onUpdate

    // 边界情况：旧子节点为空，直接挂载所有新子节点
    if (!oldChildren.length) {
      for (const child of newChildren) {
        mountNode(child, parentEl)
        onMount?.(child)
      }
      return newChildren
    }

    // 边界情况：新子节点为空，直接卸载所有旧子节点
    if (!newChildren.length) {
      for (const child of oldChildren) {
        onUnmount ? onUnmount(child, () => unmountNode(child)) : unmountNode(child)
      }
      return newChildren
    }

    // 匹配 key，获取映射和需要卸载的节点
    const { newIndexToOldIndex, removedNodes } = this.matchChildrenByKey(oldChildren, newChildren)

    // 计算最长递增子序列，优化节点移动
    const seq = this.getLIS(newIndexToOldIndex)
    let seqIndex = seq.length - 1

    // 从后向前遍历新子节点
    for (let i = newChildren.length - 1; i >= 0; i--) {
      const oldIndex = newIndexToOldIndex[i]
      const newChild = newChildren[i]
      const nextNode = newChildren[i + 1]
      const anchor = nextNode?.el

      if (oldIndex !== -1) {
        // 节点复用
        const reuseChild = oldChildren[oldIndex]
        if (onUpdate) {
          onUpdate(reuseChild, newChild, () => this.patchUpdateNode(reuseChild, newChild))
        } else {
          this.patchUpdateNode(reuseChild, newChild)
        }
        newChildren[i] = reuseChild

        // 移动节点，如果不在 LIS
        if (seqIndex >= 0 && seq[seqIndex] === i) {
          seqIndex--
        } else {
          if (anchor) dom.insertBefore(getDomTarget(reuseChild), anchor)
          else dom.appendChild(parentEl, getDomTarget(reuseChild))
        }
        continue
      }

      // 新节点挂载
      mountNode(newChild, anchor ?? parentEl, anchor ? 'insertBefore' : 'appendChild')
      onMount?.(newChild)
    }

    // 卸载不再需要的旧节点
    for (const removedNode of removedNodes) {
      onUnmount ? onUnmount(removedNode, () => unmountNode(removedNode)) : unmountNode(removedNode)
    }

    return newChildren
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

/**
 * 更新节点 - 对比新旧节点并执行更新
 *
 * @param n1 - 旧虚拟节点
 * @param n2 - 新虚拟节点
 * @returns 更新后的虚拟节点
 */
export function patchUpdate(n1: VNode, n2: VNode): VNode {
  return PatchUpdate.patch(n1, n2)
}
