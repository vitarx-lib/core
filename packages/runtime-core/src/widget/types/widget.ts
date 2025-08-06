import type { VNode } from '../../vnode/index'
import { SIMPLE_FUNCTION_WIDGET_SYMBOL } from '../core/constant'
import type { Widget } from '../core/index'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
/**
 * 组件联合类型
 *
 * 所有组件类型，包括函数组件、类组件、懒加载组件、异步组件等。
 */
export type WidgetType<P extends AnyProps = any> = ClassWidget<P> | FunctionWidget<P>
/**
 * 类组件构造器类型
 */
export type ClassWidget<P extends AnyProps = any> = new (props: P) => Widget<P, any>
/**
 * 视图构建器
 */
export type BuildVNode = () => VNode | null
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
 * 兼容tsx函数小部件类型
 */
export type TsFunctionWidget<P extends AnyProps = any> = (props: P) => VNode | null

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
