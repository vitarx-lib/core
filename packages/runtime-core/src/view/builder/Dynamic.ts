import { isFunction, logger, popProperty } from '@vitarx/utils'
import type { AnyProps, ValidChildren, View, ViewTag } from '../../types/index.js'
import { createView } from '../compiler/factory.js'
import { DynamicViewSource } from '../compiler/source.js'
import { CommentView } from '../implements/atomic.js'
import { DynamicView } from '../implements/dynamic.js'
import { builder, type ViewBuilder } from './factory.js'

export interface DynamicProps {
  /**
   * 动态视图
   *
   * 支持组件、元素标签
   */
  is: ViewTag
  /**
   * 是否根据标签记住视图
   *
   * @default false
   */
  memo?: boolean
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
 * * @param [props.memo] - 是否记住组件
 * @param [props.children] - 动态组件的子节点
 * @param [props.otherProps] - 其他透传的属性
 * @returns {View} - 返回动态组件的视图对象
 */
export const Dynamic = builder((props: DynamicProps, location): View => {
  const resolvedProps: AnyProps = {}
  const memo = popProperty(props, 'memo') ?? false
  const cache: WeakMap<Function, View> | null = memo ? new WeakMap() : null
  // 动态 props 代理
  for (const key in props) {
    if (key === 'is') continue
    Object.defineProperty(resolvedProps, key, {
      get() {
        return props[key]
      },
      enumerable: true
    })
  }
  const viewSource = new DynamicViewSource(() => {
    const is = props['is']
    if (!is) {
      const message = `Dynamic "is" prop is mandatory and cannot be empty.`
      logger.warn(message, location)
      return new CommentView(message)
    }
    if (cache && isFunction(is)) {
      const cached = cache.get(is)
      if (cached) return cached
    }
    return createView(is, resolvedProps, location)
  })

  return viewSource.isStatic ? viewSource.value : new DynamicView(viewSource, location)
})

export type Dynamic = ViewBuilder<DynamicProps> & { __is_dynamic: true }
