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
import { _handleBindProps } from './props.js'
import type { Child, VNodeInstance, VNodeProps, VNodeType } from './types/vnode.js'

/**
 * 创建虚拟节点的工厂函数
 *
 * @param type - 虚拟节点的类型，可以是字符串或对象
 * @param props - 虚拟节点的属性
 * @param children - 虚拟节点的子节点，兼容jsx:react模式
 * @returns {VNode} 返回创建的虚拟节点实例
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Child[]
): VNodeInstance<T> {
  const isValidProps = isRecordObject(props)
  const resolvedProps = isValidProps ? { ...props } : ({} as VNodeProps<T>)
  // 处理props属性，检查是否存在v-if和v-memo等特殊属性
  if (isValidProps) {
    if ('v-if' in resolvedProps && !popProperty(resolvedProps, 'v-if')) {
      return new CommentVNode('v-if') as unknown as VNodeInstance<T>
    }
    // 检查v-memo属性，如果存在则检查缓存
    const vMemoValue = resolvedProps['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = VNode.getMemoNode(vMemoValue)
      if (cached) return cached as VNodeInstance<T>
    }
  }
  // 处理子节点
  if (children.length) {
    // 如果props中已存在children属性
    if (resolvedProps.children) {
      // 如果children是数组，则合并子节点
      if (Array.isArray(resolvedProps.children)) {
        resolvedProps.children.push(...children)
      } else {
        // 如果children不是数组，则转换为数组并合并
        resolvedProps.children = [resolvedProps.children, ...children]
      }
    } else {
      // 如果props中没有children属性，则直接赋值
      resolvedProps.children = children
    }
  }
  // 如果类型是字符串，则根据不同的类型创建不同类型的虚拟节点
  if (typeof type === 'string') {
    switch (type) {
      // 处理文本节点和注释节点
      case TEXT_NODE_TYPE:
      case COMMENT_NODE_TYPE:
        let value: string = ''
        if (resolvedProps && 'children' in resolvedProps) {
          const children = resolvedProps.children
          if (typeof children === 'string') {
            value = children
          } else if (Array.isArray(children)) {
            value = children.join('')
          }
        }
        // 根据类型创建文本节点或注释节点
        // 处理片段节点
        return new (type === TEXT_NODE_TYPE ? TextVNode : CommentVNode)(
          value
        ) as unknown as VNodeInstance<T>
      case FRAGMENT_NODE_TYPE:
        // 默认处理元素节点
        return new FragmentVNode(resolvedProps) as unknown as VNodeInstance<T>
      case DYNAMIC_WIDGET_TYPE:
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
        // 如果有属性，则合并绑定的属性
        if (!isEmpty(dynamicProps)) _handleBindProps(dynamicProps, false)
        return createVNode(resolved, dynamicProps) as unknown as VNodeInstance<T>
      default:
        return new ElementVNode(type, resolvedProps) as unknown as VNodeInstance<T>
    }
  }
  if (isSimpleWidget(type)) {
    // 如果有属性，则合并绑定的属性
    if (isValidProps) _handleBindProps(resolvedProps, false)
    const vnode = type(resolvedProps)
    if (vnode === null) {
      return new CommentVNode('simple widget return null') as unknown as VNodeInstance<T>
    }
    if (!VNode.is(vnode)) throw new Error('simple widget must return a VNode')
    return vnode as unknown as VNodeInstance<T>
  }
  return new WidgetVNode(type, props) as unknown as VNodeInstance<T>
}

export { createVNode as createElement }
