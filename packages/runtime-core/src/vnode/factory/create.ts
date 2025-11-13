import { unref } from '@vitarx/responsive'
import { isRecordObject, logger, popProperty } from '@vitarx/utils'
import { useDomAdapter } from '../../adapter/index.js'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_RENDER_TYPE,
  type DynamicRenderType,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from '../../constants/index.js'
import { getMemoNode, isSameMemo, removeMemoNode } from '../../runtime/index.js'
import type {
  CommentNodeType,
  TextNodeType,
  ValidNodeProps,
  ValidNodeType,
  VNodeChild,
  VNodeInstanceType,
  VoidElementNodeType,
  WidgetType
} from '../../types/index.js'
import { getNodeDevInfo, isSupportChildren } from '../../utils/index.js'
import { CommentNode } from '../nodes/CommentNode.js'
import { FragmentNode } from '../nodes/FragmentNode.js'
import { RegularElementNode } from '../nodes/RegularElementNode.js'
import { createWidgetVNode } from '../nodes/StatefulWidgetNode.js'
import { TextNode } from '../nodes/TextNode.js'
import { VoidElementVNode } from '../nodes/VoidElementNode.js'

/**
 * 合并与规子节点。
 * 保证 `children` 始终是扁平数组。
 */
function mergeChildren(existing: any, children: any[]): any[] {
  if (!existing) return children
  if (Array.isArray(existing)) return [...existing, ...children]
  return [existing, ...children]
}

/**
 * 解析 props、处理 v-if / v-memo / children
 */
function resolveVNodeProps<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> | null,
  children: VNodeChild[]
) {
  const isValidProps = isRecordObject(props)
  const resolvedProps: Record<string, any> = isValidProps ? props : {}
  const supportChildren = isSupportChildren(type)
  if (isValidProps) {
    if (!supportChildren && 'children' in props) {
      const devInfo = getNodeDevInfo(props)
      logger.warn(`<${type}> children prop will be ignored`, devInfo?.source)
      delete props.children
    }
    // v-if
    if ('v-if' in resolvedProps && !unref(popProperty(resolvedProps, 'v-if'))) {
      return { skip: true, vnode: new CommentNode({ value: 'v-if' }) }
    }
    // v-memo
    const vMemoValue = resolvedProps['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = getMemoNode(vMemoValue)
      if (
        cached &&
        type === cached.type &&
        props?.key === cached.key &&
        isSameMemo(vMemoValue, cached.memo!)
      ) {
        logger.debug('v-memo cache hit', cached)
        return { skip: true, vnode: cached }
      }
      if (cached) {
        logger.debug('v-memo cache mismatch, invalidating', vMemoValue, cached)
        removeMemoNode(vMemoValue)
      }
    }
  }

  // children 合并
  if (supportChildren && children.length) {
    const existingChildren = resolvedProps.children
    resolvedProps.children = mergeChildren(existingChildren, children)
    // 如果 children 只有一个元素，则直接返回该元素
    resolvedProps.children.length === 1 && (resolvedProps.children = resolvedProps.children[0])
  } else if ('children' in resolvedProps) {
    delete resolvedProps.children
  }

  return { skip: false, props: resolvedProps }
}

/**
 * 创建字符串类型节点（DOM / Text / Comment / Fragment / Void）
 */
function createVNodeByType<T extends Exclude<ValidNodeType, WidgetType | DynamicRenderType>>(
  type: T,
  props: ValidNodeProps<T>
): VNodeInstanceType<T> {
  switch (type) {
    case TEXT_NODE_TYPE:
      return new TextNode(
        props as unknown as ValidNodeProps<TextNodeType>
      ) as unknown as VNodeInstanceType<T>
    case COMMENT_NODE_TYPE:
      return new CommentNode(
        props as unknown as ValidNodeProps<CommentNodeType>
      ) as unknown as VNodeInstanceType<T>
    case FRAGMENT_NODE_TYPE:
      return new FragmentNode(props) as unknown as VNodeInstanceType<T>
    default:
      if (useDomAdapter().isVoidElement(type as string)) {
        return new VoidElementVNode(
          type as VoidElementNodeType,
          props as unknown as ValidNodeProps<VoidElementNodeType>
        ) as unknown as VNodeInstanceType<T>
      }
      return new RegularElementNode(
        type as VoidElementNodeType,
        props as unknown as ValidNodeProps<VoidElementNodeType>
      ) as unknown as VNodeInstanceType<T>
  }
}

/**
 * 处理动态组件（v-is / DYNAMIC_RENDER_TYPE）
 */
function createDynamicVNode(props: Record<string, any>): VNodeInstanceType<any> {
  const { is: dynamicWidget, ...dynamicProps } = props
  const renderNodeType = unref(dynamicWidget)
  if (!renderNodeType) {
    throw new Error('dynamic render “is” prop is mandatory and cannot be empty.')
  }
  return createVNode(renderNodeType, dynamicProps)
}

/**
 * 创建虚拟节点（VNode）
 *
 * @param type 节点类型（字符串或组件构造函数）
 * @param props 节点属性
 * @param children 子节点（JSX编译兼容）
 * @returns {object} 创建的虚拟节点，如果 `v-if===false` 则返回注释节点
 */
export function createVNode<T extends ValidNodeType>(
  type: T,
  props: ValidNodeProps<T> | null = null,
  ...children: VNodeChild[]
): VNodeInstanceType<T> {
  const { skip, vnode, props: resolvedProps } = resolveVNodeProps(type, props, children)
  if (skip && vnode) return vnode as VNodeInstanceType<T>
  const propsResolved = resolvedProps!
  if (typeof type === 'string') {
    if (type === DYNAMIC_RENDER_TYPE) {
      return createDynamicVNode(propsResolved) as VNodeInstanceType<T>
    }
    return createVNodeByType(type, propsResolved) as VNodeInstanceType<T>
  }

  if (typeof type === 'function') {
    return createWidgetVNode(type as WidgetType, propsResolved) as VNodeInstanceType<T>
  }

  throw new Error('createVNode(): invalid node type')
}
