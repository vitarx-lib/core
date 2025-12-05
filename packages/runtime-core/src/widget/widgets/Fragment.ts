import type { AnyChild, FragmentNode, VNodeBuilder } from '../../types/index.js'
import { createFragmentVNode, defineNodeBuilder } from '../../vnode/index.js'

interface FragmentProps {
  children?: AnyChild
}
export type FragmentWidget = VNodeBuilder<FragmentProps, FragmentNode> & { __is_fragment__: true }
/**
 * Fragment 节点构建器
 *
 * 用于创建 Fragment 节点，将多个子节点组合成一个虚拟节点。
 *
 * @param props - Fragment 组件的属性对象
 * @param [props.children] - Fragment 节点的子节点
 * @return {FragmentNode} Fragment 节点对象
 */
export const Fragment: FragmentWidget = defineNodeBuilder((props: FragmentProps): FragmentNode => {
  return createFragmentVNode(props)
}) as FragmentWidget

export type Fragment = typeof Fragment
