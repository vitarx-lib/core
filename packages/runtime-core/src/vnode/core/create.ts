import { unref } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../../constants/index.js'
import type {
  TextVNodeType,
  ValidNodeProps,
  ValidNodeType,
  VNode,
  VNodeInstanceType
} from '../../types/index.js'
import { __DEV__, getNodeDevInfo, isWidget } from '../../utils/index.js'
import { createRegularElementNode, createVoidElementNode } from '../createor/element.js'
import { createFragmentNode } from '../createor/fragment.js'
import { createCommentNode, createTextNode } from '../createor/special.js'
import { createWidgetNode } from '../createor/widget.js'
import { isSupportChildren } from '../normalizer/props.js'

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
 * @returns VNode实例
 */
export function createVNode<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> = {} as ValidNodeProps<T>
): VNodeInstanceType<T> {
  const supportChildren = isSupportChildren(type)
  // 检查不支持children的节点
  if (__DEV__ && !supportChildren && 'children' in props) {
    const devInfo = getNodeDevInfo(props)
    logger.warn(`<${type}> children prop will be ignored`, devInfo?.source)
    delete props.children
  }

  // 处理字符串类型节点
  if (typeof type === 'string') {
    switch (type) {
      case DYNAMIC_RENDER_TYPE:
        return createDynamicVNode(props) as VNodeInstanceType<T>
      case TEXT_NODE_TYPE:
        return createTextNode(
          props as unknown as ValidNodeProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case COMMENT_NODE_TYPE:
        return createCommentNode(
          props as unknown as ValidNodeProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case FRAGMENT_NODE_TYPE:
        return createFragmentNode(props) as VNodeInstanceType<T>
      default:
        if (supportChildren) {
          return createRegularElementNode(type, props as never) as VNodeInstanceType<T>
        } else {
          return createVoidElementNode(type, props as never) as VNodeInstanceType<T>
        }
    }
  }

  // 处理组件节点
  if (isWidget(type)) {
    return createWidgetNode(type, props) as VNodeInstanceType<T>
  }

  throw new Error('createVNode(): invalid node type')
}

export { createVNode as h }
