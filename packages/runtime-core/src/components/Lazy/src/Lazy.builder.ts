import { isFunction } from '@vitarx/utils'
import type { Component, ComponentProps } from '../../../types/index.js'
import { builder, ComponentView, type ViewBuilder } from '../../../view/index.js'
import type { LazyLoader } from './Lazy.cache.js'
import { Lazy, type LazyLoadOptions } from './Lazy.core.js'

const LAZY_LOADER = Symbol.for('__v_lazy_loader')

export type LazyWrapper<T extends Component> = ViewBuilder<
  ComponentProps<T>,
  ComponentView<typeof Lazy<T>>
>

/**
 * 定义一个懒加载组件
 *
 * @example
 * ```ts
 * // 基本用法
 * const Button = lazy(() => import('./Button.js'))
 *
 * function App() {
 *   // color,children都会透传给最终渲染的Button组件
 *   return <Button color="red">按钮</Button>
 *   // 等效于
 *  // return <Lazy loader={() => import('./Button.js')} props={color="red"}>按钮</Lazy>
 * }
 *
 * // 带有loading和错误处理的用法
 * const AdvancedComponent = lazy(
 *   () => import('./AdvancedComponent.js'),
 *   {
 *     delay: 300,
 *     timeout: 5000,
 *     loading: () => <div>正在加载...</div>,
 *     onError: (error) => <div>加载失败: {String(error)}</div>
 *   }
 * )
 * ```
 *
 * @param loader - 加载器
 * @param [options] - 懒加载组件选项
 * @param [options.delay=200] - 延迟显式loading视图的时间，避免视图闪烁
 * @param [options.timeout=0] - 加载超时时间
 * @param [options.loading] - 加载中显示的节点
 * @param [options.onError] - 处理器加载失败/返回备用View
 * @returns { ViewBuilder } 懒加载组件的视图构建器
 */
export function lazy<T extends Component>(
  loader: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): LazyWrapper<T> {
  const lazyBuilder = (props: ComponentProps<T>): ComponentView<typeof Lazy<T>> => {
    return new ComponentView(Lazy<T>, { loader, ...options, props: props })
  }
  lazyBuilder.displayName = 'LazyWrapper'
  lazyBuilder[LAZY_LOADER] = loader
  return builder(lazyBuilder)
}

/**
 * 获取懒加载组件的加载器
 *
 * 该函数用于检查一个组件是否是通过 {@link lazy} 函数创建的懒加载组件，
 * 如果是则返回其内部的加载器函数，否则返回 null。
 *
 * @example
 * ```ts
 * // 基本用法 - 获取懒加载组件的 loader
 * const Button = lazy(() => import('./Button.js'))
 * const loader = getLazyLoader(Button)
 * console.log(loader) // [Function: loader]
 *
 * // 检查组件是否为懒加载组件
 * if (getLazyLoader(SomeComponent)) {
 *   console.log('这是一个懒加载组件')
 * }
 *
 * // 对非懒加载组件返回 null
 * const RegularComponent = () => createView('div', {})
 * console.log(getLazyLoader(RegularComponent)) // null
 *
 * // 用于动态获取 loader 并重新创建懒加载实例
 * const originalLoader = getLazyLoader(Button)
 * if (originalLoader) {
 *   // 可以用于缓存预加载等场景
 *   const loading = getLoadingComponent(originalLoader)
 *   if (loading) {
 *     await loading
 *     console.log('加载完成')
 *   }
 * }
 * ```
 *
 * @param component - 要检查的组件，可以是任意值
 * @returns 如果组件是通过 {@link lazy} 创建的懒加载组件，返回其 loader 函数；否则返回 null
 * @see {@link lazy} 用于创建懒加载组件
 */
export function getLazyLoader(component: any): LazyLoader<Component> | null {
  const loader = component?.[LAZY_LOADER]
  return loader && isFunction(loader) ? loader : null
}
