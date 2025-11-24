import { FRAGMENT_NODE_TYPE, NodeKind } from '../../constants/index.js'
import type { FragmentVNode, FragmentVNodeType, ValidNodeProps, VNode } from '../../types/index.js'
import { initChildren } from '../normalizer/children.js'
import { createBaseVNode } from './base.js'

/**
 * 创建片段节点
 *
 * 片段节点是一种特殊的虚拟节点，它本身不渲染为任何DOM元素，
 * 而是将其子节点直接渲染到父节点中。这允许返回多个根节点。
 *
 * @param props 包含子节点的属性对象，必须包含 children 属性
 * @returns 创建的片段虚拟节点
 */
export const createFragmentVNode = (props: ValidNodeProps<FragmentVNodeType>): FragmentVNode => {
  // 获取子节点数组
  const children = props.children as VNode[]
  // 创建基础片段节点
  const node = createBaseVNode(FRAGMENT_NODE_TYPE, NodeKind.FRAGMENT, props) as FragmentVNode
  // 初始化子节点，处理可能的嵌套结构和响应式值
  node.children = initChildren(children, node)
  return node
}
