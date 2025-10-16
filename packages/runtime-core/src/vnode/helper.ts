import { popProperty } from '@vitarx/utils'
import { isSimpleWidget } from '../widget/helper.js'
import { COMMENT_NODE_TYPE, FRAGMENT_NODE_TYPE, TEXT_NODE_TYPE } from './node-symbol.js'
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
  // 处理props属性，检查是否存在v-if和v-memo等特殊属性
  if (props) {
    if ('v-if' in props && !popProperty(props, 'v-if')) {
      return new CommentVNode('v-if') as unknown as VNodeInstance<T>
    }
    // 检查v-memo属性，如果存在则检查缓存
    const vMemoValue = props['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = VNode.getMemoNode(vMemoValue)
      if (cached) return cached as VNodeInstance<T>
    }
  } else {
    // 如果props不存在，则初始化为空对象
    props = {} as VNodeProps<T>
  }
  // 处理子节点
  if (children.length) {
    // 如果props中已存在children属性
    if (props!.children) {
      // 如果children是数组，则合并子节点
      if (Array.isArray(props!.children)) {
        props!.children.push(...children)
      } else {
        // 如果children不是数组，则转换为数组并合并
        props!.children = [props!.children, ...children]
      }
    } else {
      // 如果props中没有children属性，则直接赋值
      props!.children = children
    }
  }
  // 如果类型是字符串，则根据不同的类型创建不同类型的虚拟节点
  if (typeof type === 'string') {
    switch (type) {
      // 处理文本节点和注释节点
      case TEXT_NODE_TYPE:
      case COMMENT_NODE_TYPE:
        let value: string = ''
        if (props && 'children' in props) {
          if (typeof props.children === 'string') {
            value = props.children
          } else if (Array.isArray(props.children) && typeof props.children[0] === 'string') {
            value = props.children[0]
          }
        }
        // 根据类型创建文本节点或注释节点
        // 处理片段节点
        return new (type === TEXT_NODE_TYPE ? TextVNode : CommentVNode)(
          value
        ) as unknown as VNodeInstance<T>
      case FRAGMENT_NODE_TYPE:
        // 默认处理元素节点
        return new FragmentVNode(props) as unknown as VNodeInstance<T>
      default:
        return new ElementVNode(type, props) as unknown as VNodeInstance<T>
    }
  }
  if (isSimpleWidget(type)) {
    // 如果有属性，则合并绑定的属性
    if (props) _handleBindProps(props)
    const vnode = type(props)
    if (!VNode.is(vnode)) throw new Error('simple widget must return a VNode')
    return vnode as unknown as VNodeInstance<T>
  }
  return new WidgetVNode(type, props) as unknown as VNodeInstance<T>
}

export { createVNode as createElement }
