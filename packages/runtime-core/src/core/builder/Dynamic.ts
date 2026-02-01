import { logger } from '@vitarx/utils'
import type { AnyProps, ValidChildren, View, ViewTag } from '../../types/index.js'
import { DynamicViewSource } from '../compiler/index.js'
import { CommentView } from '../view/atomic.js'
import { DynamicView } from '../view/dynamic.js'
import { createView } from '../view/factory.js'
import { builder, type ViewBuilder } from './factory.js'

export interface DynamicProps {
  is: ViewTag
  children?: ValidChildren
  [key: string]: any
}

/**
 * 动态视图构建器
 *
 * 它接受一个名为 "is" 的属性，该属性指定要动态渲染/元素。
 * 运行时会根据 "is" 属性值动态加载并渲染相应的组件/元素。
 *
 * @example
 * ```tsx
 * // 使用动态组件
 * const App = () => {
 *   const SomeWidgetOrSomeElementTag = shallowRef(SomeWidget)
 *   return (
 *     <Dynamic is={SomeWidgetOrSomeElementTag} />
 *   )
 * }
 * ```
 *
 * @param props - 动态组件的属性对象
 * @param props.is - 动态组件要加载的组件类型
 * @param [props.children] - 动态组件的子节点
 * @param [props.otherProps] - 动态组件的其它属性
 * @returns {View} - 返回动态组件的视图对象
 */
export const Dynamic = builder((props: DynamicProps, location): View => {
  const resolvedProps: AnyProps = {}
  for (const key in props) {
    if (key === 'is') continue
    Object.defineProperty(resolvedProps, key, {
      get() {
        return props[key]
      }
    })
  }
  const view = new DynamicViewSource(() => {
    const is = props['is']
    if (!is) {
      const message = `Dynamic "is" prop is mandatory and cannot be empty.`
      logger.warn(message, location)
      return new CommentView(message)
    }
    return createView(is, resolvedProps, location)
  })
  return view.isStatic ? view.value : new DynamicView(view, location)
})

export type Dynamic = ViewBuilder<DynamicProps> & { __is_dynamic: true }
