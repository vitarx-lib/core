import { popProperty } from '@vitarx/utils'
import {
  COMMENT_NODE_TYPE,
  FRAGMENT_NODE_TYPE,
  NodeKind,
  TEXT_NODE_TYPE
} from '../constants/index.js'
import type {
  AnyProps,
  CommentVNode,
  CommentVNodeType,
  FragmentVNode,
  FragmentVNodeType,
  RegularElementVNode,
  RegularElementVNodeType,
  TextVNode,
  TextVNodeType,
  ValidNodeProps,
  VNode,
  VoidElementVNode,
  VoidElementVNodeType
} from '../types/index.js'
import { createBaseVNode } from './baseCreateor.js'
import { initChildren, propagateSVGNamespace } from './childrenNormalizer.js'
import { NormalizerStyleAndClassProp } from './propsNormalizer.js'

/**
 * 节点创建器模块
 *
 * 该模块提供了创建各种类型虚拟节点的方法，包括：
 * - 文本节点 (TextVNode)
 * - 注释节点 (CommentVNode)
 * - 片段节点 (FragmentVNode)
 * - 空元素节点 (VoidElementVNode)
 * - 常规元素节点 (RegularElementVNode)
 *
 * 所有节点创建函数都遵循统一的模式：
 * 1. 接收类型和属性参数
 * 2. 处理和标准化属性
 * 3. 创建并返回虚拟节点对象
 */

/**
 * 创建文本节点
 *
 * createTextNode({value:"文本内容"})
 *
 * @param props - 节点属性对象
 * @returns 创建的文本虚拟节点
 */
export const createTextNode = (props: ValidNodeProps<TextVNodeType>): TextVNode => {
  return createBaseVNode(TEXT_NODE_TYPE, NodeKind.TEXT, props) as TextVNode
}

/**
 * 创建注释节点
 *
 * 注释节点在渲染时通常不显示在页面上，但在开发模式下可用于调试
 *
 * createCommentNode({value:"注释内容"})
 *
 * @param props - 节点属性对象
 * @returns 创建的注释虚拟节点
 */
export const createCommentNode = (props: ValidNodeProps<CommentVNodeType>): CommentVNode => {
  return createBaseVNode(COMMENT_NODE_TYPE, NodeKind.COMMENT, props) as CommentVNode
}

/**
 * 创建片段节点
 *
 * 片段节点是一种特殊的虚拟节点，它本身不渲染为任何DOM元素，
 * 而是将其子节点直接渲染到父节点中。这允许返回多个根节点。
 *
 * @param props 包含子节点的属性对象，必须包含 children 属性
 * @returns 创建的片段虚拟节点
 */
export const createFragmentNode = (props: ValidNodeProps<FragmentVNodeType>): FragmentVNode => {
  // 获取子节点数组
  const children = props.children as VNode[]
  // 创建基础片段节点
  const node = createBaseVNode(FRAGMENT_NODE_TYPE, NodeKind.FRAGMENT, props) as FragmentVNode
  // 初始化子节点，处理可能的嵌套结构和响应式值
  node.children = initChildren(children, node)
  return node
}

/**
 * 创建空元素节点（自闭合元素）
 *
 * 空元素节点是指那些在HTML中不能有子元素的标签，如 img、input、br、hr 等。
 * 这些元素在语法上是自闭合的，不需要结束标签。
 *
 * @param type 元素类型，必须是 VoidElementNodeType 中定义的类型之一
 * @param props 元素属性对象
 * @returns 创建的空元素虚拟节点
 * @template T 空元素节点类型
 */
export const createVoidElementNode = <T extends VoidElementVNodeType>(
  type: T,
  props: ValidNodeProps<T>
): VoidElementVNode<T> => {
  // 创建基础空元素节点，并初始化元素属性
  const node = createBaseVNode(type, NodeKind.VOID_ELEMENT, props) as VoidElementVNode<T>
  NormalizerStyleAndClassProp(node.props)
  return node
}

/**
 * 创建常规元素节点
 *
 * 常规元素节点是指可以包含子节点的HTML元素，如 div、span、p 等。
 * 这些元素可以有开始标签和结束标签，并且可以包含其他元素或文本节点。
 *
 * @param type 元素类型，必须是 RegularElementNodeType 中定义的类型之一
 * @param props 元素属性对象，可以包含 children 属性表示子节点
 * @returns 创建的常规元素虚拟节点
 * @template T 常规元素节点类型
 */
export const createRegularElementNode = <T extends RegularElementVNodeType>(
  type: T,
  props: ValidNodeProps<T>
): RegularElementVNode<T> => {
  // 创建基础常规元素节点，并初始化元素属性
  const node = createBaseVNode(type, NodeKind.REGULAR_ELEMENT, props) as RegularElementVNode<T>
  // 处理样式和类属性
  NormalizerStyleAndClassProp(node.props)
  node.isSVGElement = type === 'svg'
  // 从属性中提取并移除 children 属性
  // 使用 popProperty 可以同时获取属性值并从原对象中删除该属性
  const children = popProperty(node.props as AnyProps, 'children')

  // 初始化子节点，处理可能的嵌套结构和响应式值
  node.children = initChildren(
    children,
    node,
    node.isSVGElement ? propagateSVGNamespace : undefined
  )

  return node
}
