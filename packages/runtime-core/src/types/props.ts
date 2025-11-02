import type { RefSignal } from '@vitarx/responsive'
import type { RefEl } from '../vnode/index.js'
import type { HostParentElement } from './element.js'
import type { AnyProps } from './widget.js'

/**
 * 可能是引用值的类型
 *
 * 创建一个联合类型，表示值可以是原始类型 T 或其 RefSignal 包装形式。
 * 这对于接受可以是响应式或非响应式值的API非常有用。
 *
 * @template T - 原始值类型
 *
 * @example
 * ```ts
 * // 接受可以是数字或数字的响应式引用
 * function setValue(value: MaybeRef<number>) {
 *   // 函数实现
 * }
 *
 * // 以下两种调用方式都是有效的
 * setValue(42); // 直接传入数字
 * setValue(ref(42)); // 传入响应式引用
 * ```
 */
export type MaybeRef<T> = T extends RefSignal<any, infer U> ? U | T : T | RefSignal<T>

/**
 * 属性支持引用值的类型
 *
 * 将对象类型 T 的所有属性转换为支持 RefSignal 包装的形式。
 * 这对于创建可以是响应式或非响应式的属性对象非常有用，
 * 特别是在组件属性定义和状态管理中。
 *
 * @template T - 原始对象类型
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   text: string;
 *   disabled: boolean;
 *   onClick: () => void;
 * }
 *
 * // 使用 WithRefProps 使属性支持响应式引用
 * function createButton(props: WithRefProps<ButtonProps>) {
 *   // 函数实现，可以处理响应式和非响应式属性
 * }
 *
 * // 以下两种调用方式都是有效的
 * createButton({
 *   text: 'Click me',
 *   disabled: false,
 *   onClick: () => console.log('clicked')
 * });
 *
 * createButton({
 *   text: ref('Click me'),
 *   disabled: ref(false),
 *   onClick: () => console.log('clicked')
 * });
 * ```
 */
export type WithRefProps<T extends {}> = {
  [K in keyof T]: MaybeRef<T[K]>
}
/**
 * 解包引用属性类型
 *
 * 将对象类型中的所有 RefSignal 类型解包为其内部值类型。
 * 这对于处理包含响应式引用的属性对象非常有用。
 *
 * @template T - 要解包的对象类型
 *
 * @example
 * ```ts
 * interface Props {
 *   count: RefSignal<number>;
 *   name: string;
 *   visible: RefSignal<boolean>;
 * }
 *
 * types UnwrappedProps = UnwrapRefProps<Props>;
 * // 等价于:
 * // {
 * //   count: number;
 * //   name: string;
 * //   visible: boolean;
 * // }
 * ```
 */
export type UnwrapRefProps<T extends {}> = {
  [K in keyof T]: T[K] extends RefSignal<infer U> ? U : T[K]
}
/**
 * 唯一键
 *
 * null 和 undefined 会被忽略
 */
export type UniqueKey = string | symbol | number | bigint

/**
 * 绑定属性
 *
 * 可选值：
 *   - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
 *   - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，第二个元素可以指定哪些属性不需要绑定。
 */
export type BindAttributes = Record<string, any> | [props: Record<string, any>, exclude?: string[]]

/**
 * 绑定父元素
 *
 * 可选值：
 *   - string | ParentNode | Element | null | undefined：父元素，可以是字符串选择器，也可以是 DOM 元素。
 *   - (): BindParentElementBase：动态获取父元素，返回一个字符串选择器或 DOM 元素。
 */
export type BindParentElement = string | HostParentElement | null | undefined
/**
 * 支持的全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 控制一个 `VNode` 如何替换树中的另一个 `VNode`。
   *
   * 在运行时，如果两个`VNode`的`key`相同，则会更新已渲染的`VNode`，否则会移除旧`VNode`，然后插入新`VNode`。
   *
   * 这在某些情况下很有用，例如，当您想重新排序列表时。
   *
   * 通常，作为另一个 `VNode` 的唯一子项不需要显式键。
   *
   * 除了 undefined 和 null，其他值都会被视为有效的唯一键。
   */
  key?: UniqueKey
  /**
   * 引用组件/元素实例
   */
  ref?: RefEl<any>
  /**
   * 条件渲染指令
   *
   * 如果是`v-if`的`value`==`false`，则会使用 CommonNode 做为锚点代替原始节点，
   * CommonNode节点的开销非常小，通过开发者工具可以看见 `<!--v-if-->` 注释。
   *
   * 我们更推荐使用 jsx 语法的条件渲染，如：
   * ```tsx
   * const show = ref(false)
   * // v-if 语法
   * <div v-if={show}>要显示的元素</div>
   * // jsx 条件判断语法
   * { show.value && <div>要显示的元素</div> }
   * ```
   */
  'v-if'?: MaybeRef<boolean>
  /**
   * 绑定属性
   *
   * 注意：不能通过 `v-bind` 指令绑定全局属性(ref、key、children...)，简单组件除外。
   *
   * 可选值：
   *  - Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
   *  - [props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，
   *  第二个元素可以指定哪些属性不需要绑定。
   */
  'v-bind'?: BindAttributes
  /**
   * 显示/隐藏节点
   *
   * 此属性会给元素添加上 `display: none` 样式，它可能会和元素原有的样式冲突，请自行处理。
   *
   * @example
   * ```tsx
   * const show = ref(false)
   * // v-show 语法的使用 可以忽略.value
   * <div v-show={show}></div>
   * // 渲染结果
   * <div style="display: none;"></div>
   * ```
   */
  'v-show'?: MaybeRef<boolean>
  /**
   * 缓存节点的指令
   *
   * 值必须是 array 数组，所有元素都相同（ref会解包对比），则命中缓存
   *
   * 示例：
   * ```tsx
   * function App() {
   *  return <div v-memo={[valueA, valueB]}>
   *    当组件重新渲染，如果 valueA 和 valueB 都保持不变，这个 <div> 及其子项的所有更新都将被跳过。
   *    实际上，虚拟 DOM 的 vnode 创建也将被跳过，因为缓存的子树副本可以被重新使用。
   *  </div>
   * }
   * ```
   */
  'v-memo'?: any[]
  /**
   * 静态节点的指令
   *
   * 该指令将节点标记为静态节点，只会被渲染一次，并跳过之后的更新（包括子节点更新）。
   *
   * 注意：此指令不接受动态更新，第一次是true后，不能再改为false
   */
  'v-static'?: MaybeRef<boolean>
  /**
   * 父元素 - 支持选择器或 `HTMLElement` 实例
   *
   * ```tsx
   * // 在html元素中使用
   * <div v-parent="#container">此div将会挂载到id为#container的容器中</div>
   * // 在组件上使用，使组件的内容挂载到body中，如果组件内部通过`onBeforeMount`钩子指定了父元素，`v-parent`将无效
   * <YourWidget v-parent={document.body}></YourWidget>
   * // 使用getter做为查询器
   * <div v-parent={() => document.querySelector('#container')}></div>
   * ```
   */
  'v-parent'?: BindParentElement
}
/**
 * CSS 样式规则类型
 */
export type StyleRules = Vitarx.HostStyleRules

/**
 * CSS样式规则类型
 *
 * @remarks
 * 该类型结合了csstype库的CssProperties类型和DOM原生CSSStyleDeclaration类型。
 * 它包含了所有标准CSS属性，同时也支持浏览器特定的样式属性。
 *
 * @example
 * ```ts
 * const styles: CssRules = {
 *   display: 'flex',
 *   backgroundColor: '#fff',
 *   WebkitUserSelect: 'none'
 * }
 * ```
 */
export type StyleAttribute = string | Vitarx.HostStyleRules
/**
 * class属性值类型
 *
 * @remarks
 * 该类型支持多种形式的class定义：
 * - 字符串：单个或多个以空格分隔的类名
 * - 数组：数组的每个字符串元素都会被视为一个类名,会过滤掉==false的元素
 * - 对象：键为类名，值为布尔值，表示是否应用该类
 *
 * @example
 * ```ts
 * // 字符串形式
 * const class1: ClassProperties = 'btn btn-primary'
 *
 * // 数组形式
 * const class2: ClassProperties = ['btn', 'btn-primary']
 *
 * // 对象形式
 * const class3: ClassProperties = {
 *   btn: true,
 *   'btn-primary': true,
 *   'btn-large': false
 * }
 * ```
 */
export type ClassAttribute = string | Array<any> | Record<string, boolean>

/**
 * 合并Props类型
 *
 * @param Input - 可选的属性对象
 * @param Default - 默认的属性对象
 */
export type MergeProps<Input extends {}, Default extends {}> = Omit<Input, keyof Default> & {
  [P in Extract<keyof Input, keyof Default>]-?: Default[P] extends Exclude<Input[P], undefined>
    ? Exclude<Input[P], undefined>
    : Exclude<Input[P], undefined> | Default[P]
} & Omit<Default, keyof Input>

/**
 * 从props中提取出children的类型
 *
 * @template P - 输入的属性类型
 */
export type ExtractChildrenPropType<P> = P extends { children: infer U }
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
 * types ButtonPropsWithDefaults = WithDefaultProps<ButtonProps, typeof defaultProps>;
 * // 等价于:
 * // {
 * //   text: string; // 必需属性
 * //   disabled?: boolean; // 可选属性，因为有默认值
 * //   size?: 'small' | 'medium' | 'large'; // 可选属性，因为有默认值
 * // }
 * ```
 */
export type WithDefaultProps<P extends AnyProps, D extends AnyProps | undefined> =
  D extends Partial<P> ? Partial<Pick<P, Extract<keyof D, keyof P>>> : P
