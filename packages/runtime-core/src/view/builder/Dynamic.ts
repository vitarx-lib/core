import { logger } from '@vitarx/utils'
import type { AnyProps, CreatableType, ValidChildren, View } from '../../types/index.js'
import { tracked } from '../compiler/index.js'
import { createAnchorView } from '../creator/anchor.js'
import { createDynamicView } from '../creator/dynamic.js'
import { createView } from '../creator/factory.js'
import { builder, type ViewBuilder } from './factory.js'

export interface DynamicProps {
  is: CreatableType
  children?: ValidChildren
  [key: string]: any
}

/**
 * DynamicView 组件化解析器
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
export const Dynamic = builder((props: DynamicProps, key, location): View => {
  const resolvedProps: AnyProps = {}
  for (const key in props) {
    if (key === 'is') continue
    Object.defineProperty(resolvedProps, key, {
      get() {
        return props[key]
      }
    })
  }
  const view = tracked(() => {
    const is = props['is']
    if (!is) {
      const message = `Dynamic "is" prop is mandatory and cannot be empty.`
      logger.warn(message, location)
      return createAnchorView(message)
    }
    return createView(is, resolvedProps, key, location)
  })
  return view.isStatic ? view.value : createDynamicView(view, location)
})

export type Dynamic = ViewBuilder<DynamicProps> & { __is_dynamic: true }
