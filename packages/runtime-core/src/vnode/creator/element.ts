import { isArray, logger, popProperty } from '@vitarx/utils'
import { NodeKind } from '../../constants/index.js'
import type {
  AnyProps,
  RegularElementNode,
  RegularElementNodeType,
  VNodeInputProps,
  VoidElementNode,
  VoidElementNodeType
} from '../../types/index.js'
import { initChildren, propagateSVGNamespace } from '../normalizer/children.js'
import { normalizerStyleAndClassProp } from '../normalizer/props.js'
import { createBaseVNode } from './base.js'

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
export const createVoidElementVNode = <T extends VoidElementNodeType>(
  type: T,
  props: VNodeInputProps<T>
): VoidElementNode<T> => {
  // 创建基础空元素节点，并初始化元素属性
  const node = createBaseVNode(type, NodeKind.VOID_ELEMENT, props) as VoidElementNode<T>
  normalizerStyleAndClassProp(node.props)
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
export const createRegularElementVNode = <T extends RegularElementNodeType>(
  type: T,
  props: VNodeInputProps<T>
): RegularElementNode<T> => {
  // 创建基础常规元素节点，并初始化元素属性
  const node = createBaseVNode(type, NodeKind.REGULAR_ELEMENT, props) as RegularElementNode<T>
  // 处理样式和类属性
  normalizerStyleAndClassProp(node.props)
  node.isSVGElement = type === ('svg' as RegularElementNodeType)
  // 从属性中提取并移除 children 属性
  // 使用 popProperty 可以同时获取属性值并从原对象中删除该属性
  const children = popProperty(node.props as AnyProps, 'children')
  const hasVHtml = !!(props as AnyProps)['v-html']

  if (hasVHtml) {
    // 当使用v-html时，子节点将被忽略
    if (children && (isArray(children) ? children.length > 0 : true)) {
      logger.warn(
        `<${type}> children prop will be ignored because v-html and children are mutually exclusive`,
        node.devInfo?.source
      )
    }
    node.children = []
  } else {
    // 初始化子节点，处理可能的嵌套结构和响应式值
    node.children = initChildren(
      children,
      node,
      node.isSVGElement ? propagateSVGNamespace : undefined
    )
  }

  return node
}
