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
  VNodeChild,
  VNodeInstanceType
} from '../../types/index.js'
import { __DEV__, getNodeDevInfo, isWidget } from '../../utils/index.js'
import { createRegularElementVNode, createVoidElementVNode } from '../creator/element.js'
import { createFragmentVNode } from '../creator/fragment.js'
import { createCommentVNode, createTextVNode } from '../creator/special.js'
import { createWidgetVNode } from '../creator/widget.js'
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
 * @param children - 子节点，会合并到props.children中
 * @returns VNode实例
 */
export function createVNode<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> | null = null,
  ...children: VNodeChild[]
): VNodeInstanceType<T> {
  props ??= {} as ValidNodeProps<T>
  const supportChildren = isSupportChildren(type)
  // 检查不支持children的节点
  if (__DEV__ && !supportChildren && 'children' in props) {
    const devInfo = getNodeDevInfo(props)
    logger.warn(`<${type}> children prop will be ignored`, devInfo?.source)
    delete props.children
  }
  if (supportChildren && children.length) {
    const existing = (props as Record<string, any>).children
    ;(props as Record<string, any>).children = Array.isArray(existing)
      ? [...existing, ...children]
      : existing
        ? [existing, ...children]
        : children
  }
  // 处理字符串类型节点
  if (typeof type === 'string') {
    switch (type) {
      case DYNAMIC_RENDER_TYPE:
        return createDynamicVNode(props) as VNodeInstanceType<T>
      case TEXT_NODE_TYPE:
        return createTextVNode(
          props as unknown as ValidNodeProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case COMMENT_NODE_TYPE:
        return createCommentVNode(
          props as unknown as ValidNodeProps<TextVNodeType>
        ) as VNodeInstanceType<T>
      case FRAGMENT_NODE_TYPE:
        return createFragmentVNode(props) as VNodeInstanceType<T>
      default:
        if (supportChildren) {
          return createRegularElementVNode(type, props as never) as VNodeInstanceType<T>
        } else {
          return createVoidElementVNode(type, props as never) as VNodeInstanceType<T>
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
