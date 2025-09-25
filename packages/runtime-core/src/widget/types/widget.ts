import { VNode, type WidgetType } from '../../vnode/index.js'
import type { __WIDGET_INTRINSIC_KEYWORDS__, SIMPLE_FUNCTION_WIDGET_SYMBOL } from '../constant.js'
import { Widget } from '../widget.js'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
/**
 * 兼容tsx函数小部件类型
 */
export type TsFunctionWidget<P extends AnyProps = any> = (props: P) => VNode | null
/**
 * 视图构建器类型
 */
export type BuildVNode = () => VNode | null
/**
 * 类小部件构造器类型
 *
 * @template P - 小部件的属性类型
 * @template I - 小部件实例类型
 */
export type ClassWidget<P extends AnyProps = any, I extends Widget = Widget> = new (props: P) => I
/**
 * 函数小部件有效地返回值
 *
 * - `null`：不渲染任何内容
 * - `VNode`：直接返回虚拟节点
 * - `Promise<null>`：异步返回null
 * - `Promise<VNode>`：异步返回虚拟节点
 * - `Promise<()=>VNode|null>`：异步返回视图构建器
 * - `Promise<{ default: WidgetType }>`：异步返回EsModule对象，必须有默认导出
 */
export type ValidFunctionWidgetReturnValue =
  | VNode
  | null
  | BuildVNode
  | Promise<VNode | null | BuildVNode>
  | Promise<{ default: WidgetType }>
/**
 * 函数小部件类型
 */
export type FunctionWidget<P extends AnyProps = any> = (props: P) => ValidFunctionWidgetReturnValue
/**
 * 小部件实例推导
 *
 * 通过小部件构造函数推导出小部件的实例类型
 */
export type WidgetInstance<T extends WidgetType> =
  T extends ClassWidget<any, infer R> ? R : T extends FunctionWidget<infer R> ? Widget<R> : Widget
/**
 * 懒加载小部件类型
 */
export type LazyLoadWidget<P extends AnyProps = any> = () => Promise<{
  default: FunctionWidget<P> | ClassWidget<P>
}>

/**
 * 简单小部件类型
 */
export interface SimpleWidget<T extends AnyProps = any, R extends VNode | null = VNode> {
  [SIMPLE_FUNCTION_WIDGET_SYMBOL]: true

  (props: T): R
}

/**
 * 异步函数小部件类型
 */
export type AsyncFnWidget<P extends AnyProps = any> = (
  props: P
) => Promise<VNode | null | BuildVNode>

/**
 * TSX 类型支持工具
 *
 * 将不被TSX支持的组件类型（如：异步组件，懒加载组件），重载为受支持的TSX组件类型，提供友好的参数类型校验。
 *
 * @example
 * ```tsx
 * async function AsyncWidget() {
 *   await new Promise((resolve) => setTimeout(resolve, 1000))
 *   return <div>Hello World</div>
 * }
 * export default AsyncWidget
 * // ❌ TSX 语法校验不通过！
 * <AsyncWidget />
 *
 * export default AsyncWidget as unknown as TSWidget<typeof AsyncWidget>
 * // ✅ TSX 语法校验通过！
 * <AsyncWidget />
 * ```
 */
export type TSWidget<T extends WidgetType> = TsFunctionWidget<
  T extends WidgetType<infer P> ? P : {}
>

/**
 * 排除小部件内部关键字类型工具
 *
 * 此工具会排除实例中的固有属性和方法，只保留用户定义的属性。
 */
export type ExcludeWidgetIntrinsicKeywords<T extends Widget> = {
  [K in Exclude<keyof T, (typeof __WIDGET_INTRINSIC_KEYWORDS__)[number]>]: T[K]
}

/**
 * 引用小部件类型
 *
 * 此工具会排除实例中的固有属性和方法，只保留小部件自定义属性和方法。
 *
 * @example
 * ```ts
 * class Test extends Widget {
 *   name = 'Test'
 * }
 * const refTest = refEl<ImpostWidget<Test>>()!
 * refTest.value.name // ✅ TS 语法校验通过！
 * refTest.value.$vnode() // ❌ TS 语法校验不通过！
 * refTest.value.onMount() // ❌ TS 语法校验不通过！
 * ```
 */
export type ImpostWidget<T extends Widget> = ExcludeWidgetIntrinsicKeywords<T>
