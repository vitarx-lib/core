import { unref } from '@vitarx/responsive'
import { isRecordObject, popProperty } from '@vitarx/utils'
import { logger } from '@vitarx/utils/src/index.js'
import { useDomAdapter } from '../../host-adapter/index.js'
import type {
  CommentNodeType,
  TextNodeType,
  ValidNodeType,
  VNodeChild,
  VNodeInputProps,
  VNodeInstanceType
} from '../../types/index.js'
import { isStatelessWidget } from '../../widget/index.js'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../constants/index.js'
import {
  CommentNode,
  ElementNode,
  FragmentNode,
  StatefulWidgetNode,
  StatelessWidgetNode,
  TextNode,
  VoidElementVNode
} from '../nodes/index.js'
import { getMemoNode, isSameMemo, removeMemoNode } from '../runtime/index.js'

/**
 * 创建虚拟节点（VNode）
 *
 * @param type 节点类型（字符串或组件构造函数）
 * @param props 节点属性
 * @param children 子节点（JSX编译兼容）
 * @returns {object} 创建的虚拟节点，如果`v-if==false`则返回注释节点
 */
export function createVNode<T extends ValidNodeType>(
  type: T,
  props: VNodeInputProps<T> | null = null,
  ...children: VNodeChild[]
): VNodeInstanceType<T> {
  const isValidProps = isRecordObject(props)
  const resolvedProps: VNodeInputProps<T> = isValidProps ? props : ({} as VNodeInputProps<T>)

  // ---------- v-if / v-memo ----------
  if (isValidProps) {
    if ('v-if' in resolvedProps && !unref(popProperty(resolvedProps, 'v-if'))) {
      return new CommentNode({ value: 'v-if' }) as unknown as VNodeInstanceType<T>
    }
    const vMemoValue = resolvedProps['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = getMemoNode(vMemoValue)
      if (cached) {
        if (
          type === cached.type &&
          props.key === cached.key &&
          isSameMemo(vMemoValue, cached.memo!)
        ) {
          logger.debug('v-memo hit', cached)
          return cached as VNodeInstanceType<T>
        } else {
          logger.debug(
            'v-memo hits the cache, but the node type or key is inconsistent',
            vMemoValue,
            cached
          )
          removeMemoNode(vMemoValue)
        }
      }
    }
  }
  // ---------- children ----------
  if (children.length && type !== TEXT_NODE_TYPE && type !== COMMENT_NODE_TYPE) {
    const existing = resolvedProps.children
    resolvedProps.children = Array.isArray(existing)
      ? [...existing, ...children]
      : existing
        ? [existing, ...children]
        : children
  }
  // ---------- 字符串类型节点 ----------
  if (typeof type === 'string') {
    switch (type) {
      case TEXT_NODE_TYPE:
        return new TextNode(
          resolvedProps as unknown as VNodeInputProps<TextNodeType>
        ) as unknown as VNodeInstanceType<T>
      case COMMENT_NODE_TYPE:
        return new CommentNode(
          resolvedProps as unknown as VNodeInputProps<CommentNodeType>
        ) as unknown as VNodeInstanceType<T>
      case FRAGMENT_NODE_TYPE:
        return new FragmentNode(resolvedProps) as unknown as VNodeInstanceType<T>
      case DYNAMIC_RENDER_TYPE: {
        const { is: dynamicWidget, ...dynamicProps } = resolvedProps
        const renderNodeType = unref(dynamicWidget)
        if (!renderNodeType) {
          throw new Error('dynamic render “is” prop it is mandatory and cannot be empty.')
        }
        return createVNode(renderNodeType, dynamicProps) as unknown as VNodeInstanceType<T>
      }
      default:
        if (useDomAdapter().isVoidElement(type)) {
          return new VoidElementVNode(type, resolvedProps) as unknown as VNodeInstanceType<T>
        } else {
          return new ElementNode(type, resolvedProps) as unknown as VNodeInstanceType<T>
        }
    }
  }
  // ---------- 组件 ----------
  if (typeof type === 'function') {
    if (isStatelessWidget(type)) {
      return new StatelessWidgetNode(type, resolvedProps) as unknown as VNodeInstanceType<T>
    }
    return new StatefulWidgetNode(type, resolvedProps) as unknown as VNodeInstanceType<T>
  }
  // ---------- 兜底 ----------
  throw new Error('createVNode() type parameter type is of the wrong type')
}
