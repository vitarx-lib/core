import type { FragmentView, ValidChildren, ViewResolver } from '../../types/index.js'
import { createFragmentView } from '../creator/fragment.js'
import type { DynamicProps } from './Dynamic.js'
import { viewResolver } from './factory.js'

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
export const Fragment = viewResolver((props: FragmentProps, key, location): FragmentView => {
  return createFragmentView(props.children, key, location)
})

export type Fragment = ViewResolver<DynamicProps, FragmentView> & { __is_fragment: true }
