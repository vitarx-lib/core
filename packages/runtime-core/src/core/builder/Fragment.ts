import type { ValidChildren } from '../../types/index.js'
import { FragmentView } from '../view/fragment.js'
import type { DynamicProps } from './Dynamic.js'
import { builder, type ViewBuilder } from './factory.js'

export interface FragmentProps {
  children?: ValidChildren
}
/**
 * FragmentView 构建器
 *
 * @param props - 属性对象
 * @param [props.children] - 子视图列表
 * @return {FragmentView} FragmentView 对象
 */
export const Fragment = builder((props: FragmentProps, key, location): FragmentView => {
  return new FragmentView(props.children, key, location)
})

export type Fragment = ViewBuilder<DynamicProps, FragmentView> & { __is_fragment: true }
