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
 * @param type - 节点类型
 * @param props - 节点属性
 * @returns VNode对象
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

export { createVNode as h }
