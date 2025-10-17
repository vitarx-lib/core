import { unref } from '@vitarx/responsive'
import { isEmpty, isRecordObject, popProperty } from '@vitarx/utils'
import { isSimpleWidget } from '../widget/helper.js'
import {
  COMMENT_NODE_TYPE,
  DYNAMIC_WIDGET_TYPE,
  FRAGMENT_NODE_TYPE,
  TEXT_NODE_TYPE
} from './node-symbol.js'
import {
  CommentVNode,
  ElementVNode,
  FragmentVNode,
  TextVNode,
  VNode,
  WidgetVNode
} from './nodes/index.js'
import { _handleBindAllProps, _handleBindProps } from './props.js'
import type { Child, VNodeInstance, VNodeProps, VNodeType } from './types/vnode.js'

/**
 * 创建虚拟节点（VNode）
 * @param type 节点类型（字符串或组件对象）
 * @param props 节点属性
 * @param children 子节点（JSX兼容）
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Child[]
): VNodeInstance<T> {
  const isValidProps = isRecordObject(props)
  const resolvedProps: VNodeProps<T> = isValidProps ? { ...props } : ({} as VNodeProps<T>)

  // ---------- v-if / v-bind-all / v-memo ----------
  if (isValidProps) {
    if ('v-if' in resolvedProps && !popProperty(resolvedProps, 'v-if')) {
      return new CommentVNode('v-if') as unknown as VNodeInstance<T>
    }

    _handleBindAllProps(resolvedProps)
    const vMemoValue = resolvedProps['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = VNode.getMemoNode(vMemoValue)
      if (cached) return cached as VNodeInstance<T>
    }
  }

  // ---------- children ----------
  if (children.length) {
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
      case COMMENT_NODE_TYPE: {
        const c = resolvedProps.children
        const value = Array.isArray(c) ? c.join('') : ((c ?? '') as string)
        return new (type === TEXT_NODE_TYPE ? TextVNode : CommentVNode)(
          value
        ) as unknown as VNodeInstance<T>
      }

      case FRAGMENT_NODE_TYPE:
        return new FragmentVNode(resolvedProps) as unknown as VNodeInstance<T>

      case DYNAMIC_WIDGET_TYPE: {
        const { is: dynamicWidget, ...dynamicProps } = resolvedProps
        const resolved = unref(dynamicWidget)
        if (!resolved) {
          if (import.meta.env.DEV) {
            console.warn('[Vitarx.DynamicWidget][WARN]: "is" prop 为必填且不能为空。')
          }
          return new CommentVNode(
            'DynamicWidget 构建失败，"is" prop 为必填且不能为空'
          ) as unknown as VNodeInstance<T>
        }
        if (!isEmpty(dynamicProps)) _handleBindProps(dynamicProps, false)
        return createVNode(resolved, dynamicProps) as unknown as VNodeInstance<T>
      }

      default:
        return new ElementVNode(type, resolvedProps) as unknown as VNodeInstance<T>
    }
  }

  // ---------- Widget 组件 ----------
  if (isSimpleWidget(type)) {
    if (isValidProps) _handleBindProps(resolvedProps, false)
    const vnode = type(resolvedProps)
    if (vnode === null) {
      return new CommentVNode('simple widget return null') as unknown as VNodeInstance<T>
    }
    if (!VNode.is(vnode)) {
      throw new Error('simple widget must return a VNode')
    }
    return vnode as unknown as VNodeInstance<T>
  }

  return new WidgetVNode(type, props) as unknown as VNodeInstance<T>
}

export { createVNode as createElement }
