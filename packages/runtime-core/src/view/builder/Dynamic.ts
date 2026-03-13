import { logger } from '@vitarx/utils'
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
   * 透传子视图
   */
  children?: ValidChildren
  /**
   * 其他透传的属性
   */
  [key: string]: unknown
}

/**
 * 动态视图构建器
 *
 * 它接受一个名为 "is" 的属性，该属性指定要动态渲染的元素/组件。
 * 运行时会根据 "is" 属性值动态加载并渲染相应的组件/元素。
 *
 * @example
 * ```tsx
 * // 动态切换组件
 * const ComponentA = () => <div>Component A</div>
 * const ComponentB = () => <span>Component B</span>
 *
 * const App = () => {
 *   const current = shallowRef(ComponentA)
 *   return (
 *     <>
 *       <Dynamic is={current.value} />
 *       <button onClick={() => current.value = ComponentB}>Switch</button>
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 动态切换元素标签
 * const App = () => {
 *   const tag = ref<'div' | 'span'>('div')
 *   return <Dynamic is={tag.value} className="container">Content</Dynamic>
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 配合 Freeze 实现组件缓存
 * <Freeze>
 *   <Dynamic is={currentComponent} />
 * </Freeze>
 * ```
 *
 * @param props - 动态组件的属性对象
 * @param props.is - 动态组件要加载的组件类型
 * @param [props.children] - 要透传子视图
 * @returns {View} - 返回动态组件的视图对象
 */
export const Dynamic = builder((props: DynamicProps, location): View => {
  const resolvedProps: AnyProps = {}
  for (const key in props) {
    if (key === 'is') continue
    Object.defineProperty(resolvedProps, key, {
      get() {
        return props[key]
      },
      enumerable: true,
      configurable: true
    })
  }
  const viewSource = new DynamicViewSource(() => {
    const is = props['is']
    if (!is) {
      const message = `Dynamic "is" prop is mandatory and cannot be empty.`
      logger.warn(message, location)
      return new CommentView(message)
    }
    return createView(is, resolvedProps, location)
  })

  return viewSource.isStatic ? viewSource.value : new DynamicView(viewSource, location)
})

export type Dynamic = ViewBuilder<DynamicProps> & { __is_dynamic: true }
