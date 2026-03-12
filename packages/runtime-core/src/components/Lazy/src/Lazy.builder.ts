import type { Component, ComponentProps } from '../../../types/index.js'
import { builder, ComponentView, type ViewBuilder } from '../../../view/index.js'
import { Lazy, type LazyLoadOptions } from './Lazy.core.js'

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
 *  // return <Lazy loader={() => import('./Button.js')} inject={color="red"}>按钮</Lazy>
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
): ViewBuilder<ComponentProps<T>, ComponentView<typeof Lazy<T>>> {
  const lazyBuilder = (props: ComponentProps<T>): ComponentView<typeof Lazy<T>> => {
    return new ComponentView(Lazy<T>, { loader, ...options, bindProps: props })
  }
  lazyBuilder._v_lazy = true
  return builder(lazyBuilder)
}

/**
 * 检查给定的组件是否为懒加载组件
 *
 * @param component - 要检查的组件
 * @returns {boolean} 如果组件是懒加载组件则返回true，否则返回false
 */
export function isLazy(component: any): boolean {
  // 检查组件对象是否存在，并且其_v_lazy属性是否为true
  return component?._v_lazy === true
}
