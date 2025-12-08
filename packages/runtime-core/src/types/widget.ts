import type { RequiredKeys } from '@vitarx/utils'
import type { STATELESS_F_WIDGET_SYMBOL } from '../constants/index.js'
import type { __WIDGET_INTRINSIC_METHOD_KEYWORDS__ } from '../constants/widget.js'
import type { Widget } from '../widget/index.js'
import type { StatelessWidgetNode, VNode } from './nodes/index.js'
import type { AnyChild, Renderable } from './vnode.js'

/**
 * 任意组件属性类型
 */
export type AnyProps = Record<string, any>
/**
 * 组件的子节点构建器
 */
export type ChildBuilder = Widget['build']
/**
 * 组件可选配置项。
 *
 * @template P - 组件的 props 类型
 */
export type WidgetOptions = {
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
  defaultProps?: Record<string, any>
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
  /**
   * 加载状态呈现的占位节点
   *
   * 仅异步组件支持
   */
  loading?: VNode
}
/**
 * 类小部件构造器类型
 *
 * @template P - 小部件的属性类型
 * @template I - 小部件实例类型
 */
export type ClassWidget<P extends AnyProps = any, I extends Widget = Widget<P, any>> = {
  new (props: P): I
} & WidgetOptions

/**
 * 模块小部件类型
 */
export interface LazyLoadModule {
  default: WidgetType
}
/**
 * 函数小部件有效地返回值
 *
 * - `null | false | undefined`：不渲染任何内容（但存在注释节点做为定位的锚点）
 * - `string | number`：渲染为文本节点
 * - `VNode`：虚拟节点
 * - `VNodeBuilder`：虚拟节点构建器 依赖跟踪的关键，一般由编译器自动生成
 * - `Promise<Renderable>`：异步返回受支持的Renderable，如字符串，元素节点等
 * - `Promise<VNodeBuilder>`：异步返回视图节点构建器
 * - `Promise<{ default: WidgetType }>`：异步返回EsModule对象，必须有默认导出才能识别为懒加载小部件
 */
export type FWBuildType =
  | Renderable
  | ChildBuilder
  | Promise<Renderable | LazyLoadModule | ChildBuilder>

/**
 * 函数小部件类型
 */
export type FunctionWidget<P extends AnyProps = any, R extends FWBuildType = FWBuildType> = {
  (props: P): R
} & WidgetOptions

/**
 * 函数小部件类型别名
 */
export type FC<P extends AnyProps = any> = FunctionWidget<P>
/**
 * 函数小部件类型别名
 */
export type FW<P extends AnyProps = any> = FunctionWidget<P>
/**
 * 小部件结构类型
 *
 * - StatefulWidget
 *    - ClassWidget：类小部件
 *    - FunctionWidget：函数小部件
 * - StatelessWidget：标记为无状态的小部件
 */
export type WidgetType<P extends AnyProps = any> = StatefulWidget<P> | StatelessWidget<P>
/**
 * 小部件实例推导
 *
 * 通过小部件构造函数推导出小部件的实例类型
 */
export type WidgetInstanceType<T extends ClassWidget | FunctionWidget> =
  T extends ClassWidget<any, infer I> ? I : T extends FunctionWidget<infer P> ? Widget<P> : Widget

/**
 * 组件children类型提取
 */
export type ExtractChildrenType<P extends AnyProps> = P extends { children: infer U }
  ? U
  : P extends { children?: infer U }
    ? U | undefined
    : never

/**
 * 带默认值的属性类型
 *
 * 根据默认值定义 D，将属性类型 P 中具有默认值的属性转换为可选属性。
 * 这对于组件的 defaultProps 特别有用，可以自动将具有默认值的属性标记为可选。
 *
 * 如果默认值定义 D 是属性类型 P 的部分类型，则将 D 中存在的属性转换为可选属性；
 * 否则，保持原始属性类型不变。
 *
 * @template P - 原始属性类型
 * @template D - 默认值定义类型
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   text: string;
 *   disabled: boolean;
 *   size: 'small' | 'medium' | 'large';
 * }
 *
 * // 组件默认值定义
 * const defaultProps = {
 *   disabled: false,
 *   size: 'medium'
 * };
 *
 * // 使用 WithDefaultProps 转换属性类型
 * type ButtonPropsWithDefaults = WithDefaultProps<ButtonProps, typeof defaultProps>;
 * // 等价于:
 * // {
 * //   text: string; // 必需属性
 * //   disabled?: boolean; // 可选属性，因为有默认值
 * //   size?: 'small' | 'medium' | 'large'; // 可选属性，因为有默认值
 * // }
 * ```
 */
type WithDefaultProps<P extends AnyProps, D extends AnyProps | undefined> = D extends undefined
  ? P
  : Omit<P, keyof D> & {
      [K in keyof D as K extends keyof P ? K : never]?: K extends keyof P ? P[K] : never
    }

/**
 * 组件props类型重载
 */
export type WidgetPropsType<T extends WidgetType> =
  T extends WidgetType<infer P>
    ? 'defaultProps' extends RequiredKeys<T>
      ? WithDefaultProps<P, T['defaultProps']>
      : P
    : {}

/**
 * 懒加载小部件类型
 *
 * 懒加载小部件也被视为异步函数组件的一种变体
 */
export type LazyLoadWidget<P extends AnyProps = any, T extends WidgetType = WidgetType<P>> = {
  (): Promise<{
    default: T
  }>
} & WidgetOptions

/**
 * 异步函数小部件类型
 *
 * @example
 * ```tsx
 * async function MyWidget(props) {
 *   // withAsyncContext 用于待异步解析完毕后恢复组件上下文，编译时通常会自动添加（必须是具名组件，且符合驼峰命名规范）
 *   await withAsyncContext(new Promise((resolve) => setTimeout(resolve, 1000)));
 *   onMount(() => {
 *     console.log('mounted');
 *   })
 *   return <div>Hello World</div>;
 * }
 * ```
 */
export type AsyncWidget<P extends AnyProps = any> = {
  (props: P): Promise<AnyChild | LazyLoadModule | ChildBuilder>
} & WidgetOptions

/**
 * 无状态小部件
 */
export type StatelessWidget<P extends AnyProps = any, R extends Renderable = Renderable> = {
  readonly [STATELESS_F_WIDGET_SYMBOL]: true
  (props: P): R
} & WidgetOptions

export interface StatelessWidgetSymbol {
  readonly [STATELESS_F_WIDGET_SYMBOL]: true
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

/**
 * 引用小部件类型
 *
 * 此工具会排除实例中的固有方法。
 *
 * @example
 * ```ts
 * class Test extends Widget {
 *   name = 'Test'
 * }
 * const refTest:ImpostWidget<Test> = {} as any
 * refTest.name // ✅ TS 语法校验通过！
 * refTest.onMount() // ❌ TS 语法校验不通过！
 * ```
 */
export type ImpostWidget<T extends ClassWidget | FunctionWidget> = T extends StatelessWidget
  ? StatelessWidgetNode<T>
  : ExcludeWidgetIntrinsicMethods<WidgetInstanceType<T>>

/**
 * 可以做为元素的组件类型构造函数
 */
export type JSXElementConstructor<P> = ((props: P) => FWBuildType) | (new (props: P) => Widget<any>)
