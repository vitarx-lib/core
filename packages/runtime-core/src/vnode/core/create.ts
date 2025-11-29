import { unref } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../../constants/index.js'
import type {
  AllowCreatedNodeType,
  AnyChild,
  AnyProps,
  RegularElementVNodeType,
  TextVNodeType,
  VNode,
  VNodeInputProps,
  VNodeInstanceType,
  VoidElementVNodeType
} from '../../types/index.js'
import { __DEV__, getNodeDevInfo, isWidget } from '../../utils/index.js'
import { createRegularElementVNode, createVoidElementVNode } from '../creator/element.js'
import { createFragmentVNode } from '../creator/fragment.js'
import { createCommentVNode, createTextVNode } from '../creator/special.js'
import { createWidgetVNode } from '../creator/widget.js'
import { isSupportChildren } from '../normalizer/props.js'
import { isNodeBuilder } from './utils.js'

/**
 * 处理动态组件（DYNAMIC_RENDER_TYPE）
 */
function createDynamicVNode(props: Record<string, any>): VNode {
  const { is: dynamicWidget, ...dynamicProps } = props
  const renderNodeType = unref(dynamicWidget)
  if (!renderNodeType) {
    throw new Error('dynamic render "is" prop is mandatory and cannot be empty.')
  }
  return createVNode(renderNodeType, dynamicProps)
}
/**
 * 创建虚拟节点
 *
 * 仅支持从props.children属性定义子节点，
 * 如需从第三个参数传递子节点需使用 `h()`
 *
 * @param type - 节点类型
 * @param props - 节点属性
 * @returns {VNode} VNode对象
 *
 * @example
 * ```js
 * // 创建普通HTML元素
 * const divNode = createVNode('div', { class: 'container' })
 * ```
 *
 * @example
 * ```js
 * // 创建组件节点
 * const MyWidget = () => createVNode('div', null, 'Hello')
 * const widgetNode = createVNode(MyWidget, { name: 'world' })
 * ```
 *
 * @example
 * ```js
 * // 创建文本节点
 * const textNode = createVNode('text', { value: 'Hello World' })
 * ```
 *
 * @example
 * ```js
 * // 子节点创建
 * const fragmentNode = createVNode('fragment', {
 *   children: [textNode1, textNode2]
 * })
 * ```
 *
 * @example
 * ```js
 * // 创建动态组件
 * const w = ref(MyWidget)
 * const dynamicNode = createVNode('dynamic ', {
 *   is: w,
 *   someProp: 'value'
 * })
 * ```
 */
export function createVNode<T extends AllowCreatedNodeType>(
  type: T,
  props: VNodeInputProps<T> | null = null
): VNodeInstanceType<T> {
  props ??= {} as VNodeInputProps<T>
  if (isNodeBuilder(type)) {
    return type(props) as VNodeInstanceType<T>
  }
  // 处理字符串类型节点
  if (typeof type === 'string') {
    switch (type) {
      case DYNAMIC_RENDER_TYPE:
        return createDynamicVNode(props) as VNodeInstanceType<T>
      case TEXT_NODE_TYPE:
        return createTextVNode(
          props as unknown as VNodeInputProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case COMMENT_NODE_TYPE:
        return createCommentVNode(
          props as unknown as VNodeInputProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case FRAGMENT_NODE_TYPE:
        return createFragmentVNode(props) as VNodeInstanceType<T>
      default:
        const supportChildren = isSupportChildren(type)
        // 检查不支持children的节点
        if (__DEV__ && !supportChildren && 'children' in props) {
          const devInfo = getNodeDevInfo(props)
          logger.warn(`<${type}> children prop will be ignored`, devInfo?.source)
        }
        if (supportChildren) {
          return createRegularElementVNode(
            type as unknown as RegularElementVNodeType,
            props as unknown as VNodeInputProps<RegularElementVNodeType>
          ) as VNodeInstanceType<T>
        } else {
          return createVoidElementVNode(
            type as unknown as VoidElementVNodeType,
            props as unknown as VNodeInputProps<VoidElementVNodeType>
          ) as VNodeInstanceType<T>
        }
    }
  }

  // 处理组件节点
  if (isWidget(type)) {
    return createWidgetVNode(type, props) as VNodeInstanceType<T>
  }

  throw new Error('createVNode(): invalid node type')
}

/**
 * 创建虚拟DOM节点的函数
 *
 * @param type - 节点类型，可以是字符串、组件函数或类组件
 * @param props - 节点属性对象，可选参数，默认为null
 * @param children - 子节点，可以是任意数量的子节点
 * @returns {VNode} 返回创建的虚拟DOM节点实例
 */
export function h<T extends AllowCreatedNodeType>(
  type: T, // 节点类型，受到AllowCreatedNodeType类型的约束
  props: VNodeInputProps<T> | null = null, // 节点属性，默认为null，类型为VNodeInputProps<T>或null
  ...children: AnyChild[] // 子节点，使用剩余参数语法接受任意数量的子节点
): VNodeInstanceType<T> {
  // 返回类型为VNodeInstanceType<T>，依赖于传入的type类型
  if (children.length) {
    // 如果有子节点
    props ??= {} as VNodeInputProps<T> // 如果props为null，则初始化为空对象
    ;(props as AnyProps).children = children.length === 1 ? children[0] : children // 将子节点赋值给props的children属性，如果只有一个子节点则直接赋值，否则将子节点数组赋值
  }
  return createVNode(type, props) // 调用createVNode函数创建并返回虚拟DOM节点
}
