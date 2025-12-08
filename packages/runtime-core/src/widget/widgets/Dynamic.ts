import { unref } from '@vitarx/responsive'
import type { DynamicRenderType } from '../../constants/index.js'
import type { AnyChild, CreatableType, VNode, VNodeBuilder } from '../../types/index.js'
import { createVNode, defineNodeBuilder } from '../../vnode/index.js'

interface DynamicProps {
  is: Exclude<CreatableType, DynamicRenderType | Dynamic>
  children?: AnyChild
  [key: string]: any
}
type DynamicWidget = VNodeBuilder<DynamicProps> & { __is_dynamic_render__: true }
/**
 * 动态组件
 *
 * 动态组件是一个用于动态加载和渲染组件的组件。
 * 它接受一个名为 "is" 的属性，该属性指定要动态加载的组件。
 * 动态组件会根据 "is" 属性值动态加载并渲染相应的组件。
 *
 * @example
 * ```tsx
 * // 使用动态组件
 * const App = () => {
 *   return (
 *     <Dynamic is={SomeComponent} />
 *   )
 * }
 * ```
 *
 * @param props - 动态组件的属性对象
 * @param props.is - 动态组件要加载的组件类型
 * @param props.children - 动态组件的子节点
 * @param props.otherProps - 动态组件的其它属性
 */
export const Dynamic: DynamicWidget = defineNodeBuilder((props: DynamicProps): VNode => {
  const { is: dynamicWidget, ...dynamicProps } = props
  const renderNodeType = unref(dynamicWidget)
  if (!renderNodeType) {
    throw new Error('dynamic render "is" prop is mandatory and cannot be empty.')
  }
  return createVNode(renderNodeType, dynamicProps)
}) as DynamicWidget
export type Dynamic = typeof Dynamic
