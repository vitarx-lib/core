import { Ref, unref } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { NodeKind } from '../../constants/index.js'
import { linkParentNode } from '../../runtime/index.js'
import type {
  AnyChild,
  HostElementNames,
  RegularElementVNode,
  UniqueKey,
  VNode,
  VNodeNormalizedChildren
} from '../../types/index.js'
import { __DEV__, isElementNode, isVNode } from '../../utils/index.js'
import { createTextVNode } from '../creator/special.js'

/**
 * 递归处理SVG子节点
 *
 * @param node - 当前节点
 */
export const propagateSVGNamespace = (node: VNode) => {
  if (
    isElementNode(node) &&
    !node.isSVGElement &&
    node.type !== ('foreignObject' as unknown as HostElementNames)
  ) {
    node.isSVGElement = true
    if (node.kind === NodeKind.REGULAR_ELEMENT) {
      for (const child of (node as RegularElementVNode).children) {
        propagateSVGNamespace(child)
      }
    }
  }
}

/**
 * 检查虚拟节点的key值是否重复
 *
 * 在虚拟DOM中，key用于标识节点的唯一性，特别是在列表渲染时。
 * 重复的key可能导致渲染错误或性能问题，因此需要在开发模式下进行警告。
 *
 * @param vnode 要检查的虚拟节点
 * @param keySet 已收集的key集合，用于检测重复
 */
const checkDuplicateKey = (vnode: VNode, keySet: Set<UniqueKey>): void => {
  // 如果节点没有key值，直接返回，无需检查
  if (vnode.key == null || keySet == undefined) return

  // 检查key是否已存在于集合中
  if (keySet.has(vnode.key)) {
    // 如果key重复，记录警告信息，包含节点源码位置（如果有）
    logger.warn(
      `Duplicate key ${String(vnode.key)} detected, which can cause rendering errors or performance issues`,
      vnode.devInfo?.source
    )
  } else {
    // 如果key不重复，将其添加到集合中
    keySet.add(vnode.key)
  }
}

/**
 * 将单个节点标准化为虚拟节点
 *
 * 如果输入已经是虚拟节点，则直接返回（同时检查key重复）；
 * 否则，将输入值转换为文本节点。
 *
 * @param current 要标准化的节点，可能是任意类型的值
 * @param keySet 用于检查key重复的集合
 * @returns 标准化后的虚拟节点，如果输入为无效值则返回undefined
 */
const normalizeChild = (current: unknown, keySet: Set<UniqueKey>): VNode | undefined => {
  // 检查当前值是否已经是虚拟节点
  if (isVNode(current)) {
    // 在开发模式下，检查节点的key是否重复
    if (__DEV__) {
      checkDuplicateKey(current, keySet)
    }
    return current
  }

  // 对于非虚拟节点值，将其转换为文本节点
  // 使用String()确保所有类型的值都能转换为字符串
  return createTextVNode({ value: String(current) })
}

/**
 * 扁平化并标准化子节点（迭代优化版）
 *
 * 该函数使用迭代而非递归的方式处理嵌套的子节点数组，
 * 避免了深度嵌套时可能导致的栈溢出问题。
 *
 * 主要处理流程：
 * 1. 初始化key集合用于检查重复key
 * 2. 使用栈结构进行迭代处理，扁平化嵌套数组
 * 3. 将每个非VNode值转换为文本节点
 * 4. 建立子节点与父节点的关联
 * 5. 应用可选的处理函数
 *
 * @param children 子节点或子节点列表，可以是单个值、数组或嵌套数组
 * @param parent 父节点，用于建立父子关系
 * @param handler 可选的额外处理函数，对每个标准化后的节点进行自定义处理
 * @returns 标准化后的子节点数组
 */
export const initChildren = (
  children: AnyChild | Ref<AnyChild>,
  parent: VNode,
  handler?: (node: VNode) => void
): VNodeNormalizedChildren => {
  // 初始化key集合，用于检测重复的key值
  const keySet = new Set<UniqueKey>()
  // 初始化子节点列表，用于存储最终结果
  const childList: VNode[] = []
  // 初始化栈结构，用于迭代处理嵌套数组
  // 首先将顶层子节点解包后压入栈中
  const stack: Array<AnyChild> = [unref(children)]

  // 使用迭代方式处理栈中的元素，直到栈为空
  while (stack.length > 0) {
    // 弹出栈顶元素并解包可能的响应式值
    const current = unref(stack.pop()!)

    // 如果当前元素是数组，需要将其元素逆序压入栈中
    // 逆序是为了保持原始顺序，因为栈是后进先出的数据结构
    if (Array.isArray(current)) {
      // 逆序压栈以保持顺序
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(unref(current[i]))
      }
    }
    // 过滤掉无效值：null、boolean、undefined
    else if (current !== null && typeof current !== 'boolean' && current !== undefined) {
      // 将当前值标准化为虚拟节点
      const childNode = normalizeChild(current, keySet)
      if (childNode) {
        // 建立子节点与父节点的关联
        linkParentNode(childNode, parent)
        // 如果提供了处理函数，则调用它
        handler?.(childNode)
        // 将处理后的节点添加到结果列表中
        childList.push(childNode)
      }
    }
  }

  // 返回处理后的子节点列表
  return childList
}
