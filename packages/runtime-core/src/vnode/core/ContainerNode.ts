import { unref } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { NodeShapeFlags } from '../../constants/index.js'
import { linkParentNode } from '../../runtime/index.js'
import type {
  ContainerNodeType,
  UniqueKey,
  VNodeChild,
  VNodeChildren,
  VNodeNormalizedChildren
} from '../../types/index.js'
import { __DEV__, isVNode } from '../../utils/index.js'
import { CommentNode } from '../nodes/CommentNode.js'
import { TextNode } from '../nodes/TextNode.js'
import type { HostNode } from './HostNode.js'
import type { VNode } from './VNode.js'

/**
 * 容器节点接口，继承自 HostNode
 *
 * ContainerNode 是一个接口约束，用于描述具有子节点的容器节点。
 * 容器节点可以包含其他节点作为其子节点，并负责管理这些子节点的生命周期。
 *
 * @template T - 容器节点类型，默认为 ContainerNodeType
 * @interface ContainerNode
 * @extends HostNode<T>
 * @property {VNodeNormalizedChildren} children - 容器节点的子节点集合
 *
 * 可以通过 `mixinContainerNode` api 将容器节点的响应逻辑扩展进节点实例中。
 */
export interface ContainerNode<T extends ContainerNodeType = ContainerNodeType>
  extends HostNode<T> {
  /**
   * 运行时子节点列表
   *
   * @type {VNodeNormalizedChildren}
   * @readonly 此属性虽然是公开的，但请不要修改它，会导致节点树结构异常，仅内部patch时会替换为新的子节点列表
   */
  children: VNodeNormalizedChildren
}

/**
 * 将容器节点相关的方法混入到节点实例中
 *
 * 这个函数为容器节点添加管理子节点生命周期的能力，包括挂载、卸载、激活、
 * 停用和渲染子节点的方法。
 *
 * @param {ContainerNode} node - 需要混入容器节点能力的节点实例
 */
export const mixinContainerNode = (node: ContainerNode) => {
  /**
   * 挂载所有子节点到DOM中
   * @this ContainerNode
   */
  node['mountChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.mount()
    }
  }

  /**
   * 卸载所有子节点
   * @this ContainerNode
   */
  node['unmountChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.unmount()
    }
  }

  /**
   * 激活所有子节点
   * 激活通常指将节点从非活动状态转换为活动状态
   * @this ContainerNode
   */
  node['activateChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.activate(this.shapeFlags === NodeShapeFlags.FRAGMENT)
    }
  }

  /**
   * 停用所有子节点
   * 停用通常指将节点从活动状态转换为非活动状态
   * @this ContainerNode
   */
  node['deactivateChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.deactivate(this.shapeFlags === NodeShapeFlags.FRAGMENT)
    }
  }

  /**
   * 渲染所有子节点并将其添加到DOM中
   * @this ContainerNode
   */
  node['renderChildren'] = function (this: ContainerNode) {
    for (const child of this.children) {
      child.render()
      this.dom.appendChild(this.element, child.operationTarget)
    }
  }
}

/**
 * 将单个节点转换为 VNode
 */
const normalizeChild = (current: unknown, keySet: Set<UniqueKey>): VNode | undefined => {
  if (current == null || typeof current === 'boolean') {
    return __DEV__ ? new CommentNode({ value: String(current) }) : undefined
  }
  if (isVNode(current)) {
    checkDuplicateKey(current, keySet)
    return current
  }
  return new TextNode({ value: String(current) })
}

/**
 * 检查 VNode 的 key 是否重复
 */
const checkDuplicateKey = (vnode: VNode, keySet: Set<UniqueKey>): void => {
  if (vnode.key == null) return
  if (keySet.has(vnode.key)) {
    logger.warn(
      `Duplicate key ${String(vnode.key)} detected, which can cause rendering errors or performance issues`,
      vnode.devInfo?.source
    )
  } else {
    keySet.add(vnode.key)
  }
}

/**
 * 扁平化并标准化子节点 (迭代优化版)
 *
 * @param children - 子节点/子节点列表
 * @param parent - 父节点
 * @param handler - 额外处理函数
 * @returns {VNode[]} 返回一个包含所有子节点的数组
 */
export const normalizeChildren = (
  children: VNodeChild | VNodeChildren,
  parent: VNode,
  handler?: (node: VNode) => void
): VNodeNormalizedChildren => {
  const keySet = new Set<UniqueKey>()
  const childList: VNode[] = []
  const stack: Array<VNodeChild | VNodeChildren> = [unref(children)]

  while (stack.length > 0) {
    const current = unref(stack.pop()!)
    if (Array.isArray(current)) {
      // 逆序压栈以保持顺序
      for (let i = current.length - 1; i >= 0; i--) {
        stack.push(unref(current[i]))
      }
    } else {
      const childNode = normalizeChild(current, keySet)
      if (childNode) {
        linkParentNode(childNode, parent)
        handler?.(childNode)
        childList.push(childNode)
      }
    }
  }

  return childList
}
