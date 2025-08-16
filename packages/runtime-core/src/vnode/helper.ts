import { CommentVNode, ElementVNode, FragmentVNode, TextVNode, VNode, WidgetVNode } from './nodes'
import { type Child, type VNodeProps, VNodeType } from './types'

/**
 * 创建虚拟节点的工厂函数
 *
 * @param type - 虚拟节点的类型，可以是字符串或对象
 * @param props - 虚拟节点的属性
 * @param children - 虚拟节点的子节点
 * @returns {VNode} 返回创建的虚拟节点实例
 */
export function createVNode<T extends VNodeType>(
  type: T,
  props: VNodeProps<T> | null = null,
  ...children: Child[]
): VNode<T> {
  // 如果类型是字符串，则根据不同的类型创建不同类型的虚拟节点
  if (typeof type === 'string') {
    switch (type) {
      // 处理文本节点和注释节点
      case 'text-node':
      case 'comment-node':
        let value: string = ''
        // 从props或children中获取节点的值
        if (typeof props?.children === 'string') {
          value = props.children
        } else if (typeof children[0] === 'string') {
          value = children[0]
        }
        // 根据类型创建文本节点或注释节点
        // 处理片段节点
        return new (type === 'text-node' ? TextVNode : CommentVNode)(value) as unknown as VNode<T>
      case 'fragment-node':
        // 默认处理元素节点
        return new FragmentVNode(props, children) as unknown as VNode<T>
      default:
        return new ElementVNode(type, props, children) as unknown as VNode<T>
    }
    // 如果类型不是字符串，则创建组件节点
  }
  return new WidgetVNode(type, props, children) as unknown as VNode<T>
}
