import { STATELESS_FUNCTION_WIDGET_SYMBOL } from '../constants/index.js'
import { type __WIDGET_INTRINSIC_METHOD_KEYWORDS__ } from '../constants/widget.js'
import type { Widget } from '../widget/index.js'
import type { VNodeChild } from './vnode.js'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
/**
 * 视图构建器类型
 */
export type VNodeBuilder = Widget['build']
/**
 * 组件可选配置项。
 *
 * @template P - 组件的 props 类型
 */
export type WidgetOptions<P extends AnyProps> = {
  /**
   * 定义组件的默认属性。
   *
   * - 在组件实例创建时，`defaultProps` 会自动注入到 `props` 中。
   * - 当外部未传入某个属性时，其默认值通过代理的 `get` 拦截动态返回，
   *   因此 **不会直接合并到 `props` 对象本身**。
   * - 注意：在组件实例中，`props` 是只读的响应式代理：
   *   - 属性值不可修改；
   *   - 使用 `key in props` 无法判断默认值是否存在；
   *   - 默认值的访问由代理层动态处理。
   *
   * @example
   * ```ts
   * // 类组件
   * class MyWidget extends Widget<{ name?: string; age: number }> {
   *   static defaultProps = {
   *     age: 18,
   *   };
   * }
   *
   * // 函数组件
   * function MyFunctionWidget(props: { name?: string; age: number }) {
   *   return <div>{props.name}</div>;
   * }
   * MyFunctionWidget.defaultProps = {
   *   age: 18,
   * };
   * ```
   */
  defaultProps?: Partial<P>
  /**
   * 属性验证函数。
   *
   * 用于校验传入的 props 是否符合预期
   *
   * 校验时机：仅开发模式下节点创建之前进行校验
   *
   * 校验结果说明：
   * - `string`：校验失败但不影响节点运行，打印该自定义异常提示。
   * - `false`：打印默认的参数错误信息。
   * - throw new Error('自定义异常')：如果不希望继续渲染组件，则可以抛出异常，异常将会由父级捕获并处理。
   * - 其他值/void：校验通过。
   *
   * 框架在开发模式下会自动捕获异常并将其转换为校验错误。
   *
   * @param props - 传入的组件属性对象
   * @returns {string | false | unknown} 校验结果
   */
  validateProps?: (props: AnyProps) => string | false | unknown
  /**
   * 组件名称
   *
   * 如果匿名组件不定义此名称，则默认使用 `AnonymousWidget` 作为名称。
   */
  displayName?: string
}
/**
 * 类小部件构造器类型
 *
 * @template P - 小部件的属性类型
 * @template I - 小部件实例类型
 */
export type ClassWidget<P extends AnyProps = any, I extends Widget = Widget> = {
  new (props: P): I
} & WidgetOptions<P>
/**
 * 模块小部件类型
 */
export interface LazyLoadModule {
  default: WidgetTypes
}
/**
 * 函数小部件有效地返回值，会提供给 `JSX.Element` 使用，让 tsx 能够兼容 vitarx 特有的函数组件返回值类型
 *
 * - `null | false | undefined`：不渲染任何内容（但存在注释节点做为定位的锚点）
 * - `string | number`：渲染为文本节点
 * - `NodeBuilder`：视图节点构建器
 * - `Promise<VNodeChild>`：异步返回受支持的VNodeChild，如字符串，元素节点等
 * - `Promise<VNodeBuilder>`：异步返回视图节点构建器
 * - `Promise<{ default: WidgetTypes }>`：异步返回EsModule对象，必须有默认导出才能识别为懒加载小部件
 */
export type ValidBuildResult =
  | VNodeChild
  | VNodeBuilder
  | Promise<VNodeChild | LazyLoadModule | VNodeBuilder>

/**
 * 函数小部件类型
 */
export type FunctionWidget<P extends AnyProps = any> = {
  (props: P): ValidBuildResult
} & WidgetOptions<P>
/**
 * 函数小部件类型别名
 */
export type FC<P extends AnyProps = any> = FunctionWidget<P>
/**
 * 小部件结构类型
 *
 * - ClassWidget：类小部件
 * - FunctionWidget：函数小部件
 * - StatelessWidget：无状态小部件
 */
export type WidgetTypes<P extends AnyProps = any> = StatefulWidget<P> | StatelessWidget<P>
/**
 * 小部件实例推导
 *
 * 通过小部件构造函数推导出小部件的实例类型
 */
export type WidgetInstance<T extends ClassWidget | FunctionWidget> =
  T extends ClassWidget<any, infer I> ? I : T extends FunctionWidget<infer P> ? Widget<P> : Widget

/**
 * Widget节点Props类型重载
 */
export type WidgetPropsType<T extends WidgetTypes> = T extends WidgetTypes<infer P> ? P : {}

/**
 * 懒加载组件
 *
 * 通常用于代码分块加载，vite 不会将其构建在入口js文件中，而是单独分包，在需要时才会加载。
 */
export type LazyLoadWidget<
  P extends AnyProps = any,
  T extends WidgetTypes = WidgetTypes<P>
> = () => Promise<{
  default: T
}>

/**
 * 异步函数小部件类型
 */
export type AsyncWidget<P extends AnyProps = any> = (props: P) => Promise<VNodeChild>

/**
 * 无状态小部件
 */
export type StatelessWidget<P extends AnyProps = any, R extends VNodeChild = VNodeChild> = {
  readonly [STATELESS_FUNCTION_WIDGET_SYMBOL]: true
  (props: P): R
} & WidgetOptions<P>

export interface StatelessWidgetSymbol {
  readonly [STATELESS_FUNCTION_WIDGET_SYMBOL]: true
}

/**
 * 有状态的小部件
 *
 * 只要未显式标记为无状态的小部件，则默认为有状态的小部件
 */
export type StatefulWidget<P extends AnyProps = any> = ClassWidget<P> | FunctionWidget<P>

/** 排除组件内部保留的方法 */
export type ExcludeWidgetIntrinsicMethods<T> = Omit<
  T,
  (typeof __WIDGET_INTRINSIC_METHOD_KEYWORDS__)[number]
>
