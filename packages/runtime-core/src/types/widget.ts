import type { SIMPLE_FUNCTION_WIDGET_SYMBOL, Widget } from '../widget/index.js'
import type { Child } from './vnode.js'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
/**
 * 视图构建器类型
 */
export type ViewBuilder = Widget['build']
/**
 * 类小部件构造器类型
 *
 * @template P - 小部件的属性类型
 * @template I - 小部件实例类型
 */
export type ClassWidget<P extends AnyProps = any, I extends Widget = Widget> = {
  defaultProps?: Record<string, any>
  new (props: P): I
}
/**
 * 模块小部件类型
 */
export interface LazyWidgetModule {
  default: WidgetType
}
/**
 * 函数小部件有效地返回值，会提供给 `JSX.Element` 使用，让 tsx 能够兼容 vitarx 特有的函数组件返回值类型
 *
 * - `null | false | undefined`：不渲染任何内容
 * - `string | number`：渲染为文本节点
 * - `BuildVNode`：视图节点构建器
 * - `Promise<ValidCreatedChild>`：异步返回任意节点
 * - `Promise<BuildVNode>`：异步返回视图节点构建器
 * - `Promise<{ default: WidgetConstructorType }>`：异步返回EsModule对象，必须有默认导出才能识别为懒加载小部件
 */
export type ValidBuildElement =
  | Child
  | ViewBuilder
  | Promise<Child | LazyWidgetModule | ViewBuilder>

/**
 * 函数小部件类型
 */
export type FunctionWidget<P extends AnyProps = any> = {
  defaultProps?: Partial<P>
  (props: P): ValidBuildElement
}

/**
 * 小部件结构类型
 */
export type WidgetType<P extends AnyProps = any> =
  | ClassWidget<P>
  | FunctionWidget<P>
  | SimpleWidget<P>

/**
 * 小部件实例推导
 *
 * 通过小部件构造函数推导出小部件的实例类型
 */
export type WidgetInstanceType<T extends WidgetType> =
  T extends ClassWidget<any, infer I> ? I : T extends FunctionWidget<infer P> ? Widget<P> : Widget

/**
 * Widget节点Props类型重载
 */
export type WidgetPropsType<T extends WidgetType> = T extends WidgetType<infer P> ? P : {}

/**
 * 懒加载小部件类型
 */
export type LazyWidget<P extends AnyProps = any> = () => Promise<{
  default: WidgetType<P>
}>

/**
 * 异步函数小部件类型
 */
export type AsyncWidget<P extends AnyProps = any> = (props: P) => Promise<Child>

/**
 * 简单小部件类型
 */
export interface SimpleWidget<
  P extends AnyProps = any,
  R extends Child = Child,
  DP extends Partial<P> = Partial<P>
> {
  readonly [SIMPLE_FUNCTION_WIDGET_SYMBOL]: true
  defaultProps?: DP
  (props: P): R
}

export interface SimpleWidgetSymbol {
  readonly [SIMPLE_FUNCTION_WIDGET_SYMBOL]: true
}
