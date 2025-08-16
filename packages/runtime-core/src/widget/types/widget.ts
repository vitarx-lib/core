import {
  type BuildVNode,
  type ClassWidget,
  type FunctionWidget,
  VNode,
  type WidgetType
} from '../../vnode'
import { SIMPLE_FUNCTION_WIDGET_SYMBOL } from '../constant'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
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
