import type { Component, HostContainer, View, ViewContext } from '../../types/index.js'
import { ComponentView, createComponentView } from '../../view/index.js'
import { isView } from './is.js'

/**
 * 渲染组件
 *
 * @param component - 要渲染的组件
 * @param container - 视图将被挂载到的宿主容器
 * @param [ctx] - 可选的视图上下文参数
 * @param [ctx.app] - 可选的应用实例
 * @param [ctx.owner] - 可选的父组件实例
 * @returns - 返回渲染后的视图对象
 *
 * @example
 * ```js
 * import { ModalComponent } from 'xxxx'
 * // 渲染组件到body中
 * const view = render(ModalComponent, document.body)
 * setTimeout(() => {
 *    view.dispose() // 销毁
 * }, 3000)
 * ```
 */
export function render<T extends Component>(
  component: Component,
  container: HostContainer,
  ctx?: ViewContext
): ComponentView<T>

/**
 * 渲染视图
 *
 * @param view - 要渲染的视图
 * @param container - 视图将被挂载到的宿主容器
 * @param [ctx] - 可选的视图上下文参数
 * @param [ctx.app] - 可选的应用实例
 * @param [ctx.owner] - 可选的父组件实例
 * @returns - 返回渲染后的视图对象
 * @example
 * ```jsx
 * const view = render(<div>Hello World</div>, document.body)
 * setTimeout(() => {
 *    view.dispose() // 销毁
 * }, 3000)
 * ```
 */
export function render<T extends View>(view: T, container: HostContainer, ctx?: ViewContext): T

/**
 * 渲染视图或组件到指定容器
 *
 * @param view - 要渲染的视图或组件函数
 * @param container - 目标容器
 * @param ctx - 可选的视图上下文
 * @returns - 渲染后的视图实例
 */
export function render(view: View | Component, container: HostContainer, ctx?: ViewContext): View {
  // 如果传入的是函数，则创建组件视图
  if (typeof view === 'function') {
    view = createComponentView(view)
  } else if (!isView(view)) {
    throw new Error('render() param $1 must be a function or a View instance')
  }
  // 返回类型与输入的视图类型相同
  return view.init(ctx).mount(container, 'append')
}
