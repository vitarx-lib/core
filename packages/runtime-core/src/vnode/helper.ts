import { popProperty } from '@vitarx/utils'
import { isSimpleWidget } from '../widget/index'
import { CommentVNode, ElementVNode, FragmentVNode, TextVNode, VNode, WidgetVNode } from './nodes'
import { type Child, type VNodeInstance, type VNodeProps, VNodeType } from './types'

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
  if (props) {
    const vIf = popProperty(props, 'v-if')
    if (vIf) return new CommentVNode('v-if') as unknown as VNodeInstance<T>
    const vMemoValue = props['v-memo']
    if (Array.isArray(vMemoValue)) {
      const cached = VNode.getMemoNode(vMemoValue)
      if (cached) return cached as VNodeInstance<T>
    }
  } else {
    props = {} as VNodeProps<T>
  }
  if (children.length) {
    if (props!.children) {
      if (Array.isArray(props!.children)) {
        props!.children.push(...children)
      } else {
        props!.children = [props!.children, ...children]
      }
    } else {
      props!.children = children
    }
  }
  // 如果类型是字符串，则根据不同的类型创建不同类型的虚拟节点
  if (typeof type === 'string') {
    switch (type) {
      // 处理文本节点和注释节点
      case 'text-node':
      case 'comment-node':
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
        return new (type === 'text-node' ? TextVNode : CommentVNode)(
          value
        ) as unknown as VNodeInstance<T>
      case 'fragment-node':
        // 默认处理元素节点
        return new FragmentVNode(props) as unknown as VNodeInstance<T>
      default:
        return new ElementVNode(type, props) as unknown as VNodeInstance<T>
    }
  }
  if (isSimpleWidget(type)) {
    const vnode = type.call(null, props)
    if (!VNode.is(vnode)) throw new Error('simple widget must return a VNode')
    return vnode as unknown as VNodeInstance<T>
  }
  return new WidgetVNode(type, props) as unknown as VNodeInstance<T>
}

export { createVNode as createElement }

/**
 * 获取当前虚拟节点(WidgetVNode)的函数
 * 该函数通过调用WidgetVNode类的静态方法getCurrentVNode()来实现
 *
 * @alias useCurrentVNode
 * @returns {WidgetVNode | undefined} 如果有则返回当前活动的虚拟节点(VNode)实例
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  return WidgetVNode.getCurrentVNode() // 调用WidgetVNode类的静态方法获取当前VNode
}

export { getCurrentVNode as useCurrentVNode }

/**
 * 检查给定的值是否为VNode节点
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是VNode节点则返回true，否则返回false
 */
export function isVNode(val: any): val is VNode {
  return VNode.is(val) // 调用VNode类的静态is方法来判断传入的值是否为VNode实例
}
