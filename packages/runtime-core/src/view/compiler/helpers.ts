import { isView } from '../../shared/index.js'
import type { Component, HostContainer, RenderUnit, View, ViewContext } from '../../types/index.js'
import { ComponentView, DynamicView } from '../implements/index.js'
import { createComponentView } from './factory.js'
import { DynamicViewSource } from './source.js'

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

/**
 * 创建一个表达式级动态视图（Expression-level Dynamic View）。
 *
 * `dynamic` 用于声明一个依赖响应式数据的动态子树。当构建函数内部
 * 访问的响应式依赖发生变化时，当前动态视图会自动重新执行构建函数，
 * 并根据新的返回结果更新对应的子视图。
 *
 * 它主要用于在 **非 JSX 编译上下文** 或 **普通函数体表达式**
 * 中创建可自动更新的视图区域。
 *
 * 与 `Dynamic` 组件不同：
 *
 * - `Dynamic` 适用于根据 `is` 属性切换组件或标签类型（结构级动态）
 * - `dynamic` 适用于根据响应式表达式结果重建子树（表达式级动态）
 *
 * ---
 *
 * ## 工作机制
 *
 * - 在首次执行时运行 `build` 构建初始子视图
 * - 自动追踪 `build` 内部访问的响应式依赖
 * - 当依赖变更时重新执行 `build`
 * - 对新旧结果进行最小必要更新
 *
 * ---
 *
 * ## 适用场景
 *
 * - 三元表达式返回不同视图
 * - 基于响应式条件切换视图
 * - 在普通函数中构建可自动更新的视图
 *
 * ---
 *
 * ## 示例
 *
 * ```tsx
 * function App() {
 *   const show = ref(true)
 *
 *   return dynamic(() =>
 *     show.value ? <A /> : <B />
 *   )
 * }
 * ```
 *
 * 也可以返回原始类型：
 *
 * ```ts
 * dynamic(() => count.value)
 * ```
 *
 * ---
 *
 * ## 注意事项
 *
 * - `build` 必须是无参数函数
 * - 不应在 `build` 中执行副作用逻辑
 * - 返回值必须满足 `RenderUnit` 类型约束
 *
 * ---
 *
 * @template T - 构建函数返回值类型，必须符合 `RenderUnit`
 * @param build 用于构建子视图的函数。函数内部可访问响应式数据。
 * @returns 返回一个 `DynamicView<T>` 实例
 */
export function dynamic<T extends RenderUnit>(build: () => T): DynamicView<T> {
  return new DynamicView(new DynamicViewSource(build))
}
