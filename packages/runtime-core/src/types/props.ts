import type { Ref, UnwrapRef } from '@vitarx/responsive'
import type { PickRequired } from '@vitarx/utils'
import type { Dynamic, DynamicProps, Fragment, FragmentProps } from '../core/index.js'
import type { AnyProps, Component, ComponentProps } from './component.js'
import type { HostElementTag, IntrinsicElements } from './element.js'
import type { CreatableType } from './view.js'

/**
 * 可能是引用值的类型
 *
 * 创建一个联合类型，表示值可以是原始类型 T 或其 Ref 包装形式。
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
export type MaybeRef<T> = T extends Ref<infer U, any> ? U | T : T | Ref<T>

/**
 * 属性支持引用值的类型
 *
 * 将对象类型 T 的所有属性转换为支持 Ref 包装的形式。
 * 这对于创建可以是响应式或非响应式的属性对象非常有用，
 * 特别是在组件属性定义和状态管理中。
 *
 * @template T - 原始对象类型
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   text: string;
 *   disabled?: boolean;
 *   onClick: () => void;
 * }
 *
 * // 使用 WithRefProps 使属性支持响应式引用
 * function createButton(props: WithRefProps<ButtonProps>) {
 *   // 函数实现，可以处理响应式和非响应式属性
 * }
 *
 * // 以下两种参数类型都有效
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
export type WithRefProps<T extends AnyProps> = { [K in keyof T]: MaybeRef<T[K]> }

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
 *   count: Ref<number>;
 *   name: string;
 *   visible: Ref<boolean>;
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
export type UnwrapRefProps<T extends AnyProps> = { [K in keyof T]: UnwrapRef<T[K]> }

/**
 * 绑定属性
 *
 * 可选值：
 *   - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
 *   - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，第二个元素可以指定哪些属性不需要绑定。
 */
export type BindAttributes = Record<string, any> | [props: Record<string, any>, exclude?: string[]]

/**
 * 支持的全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 引用组件/元素实例
   */
  ref?: Ref<unknown>
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
   * 支持传入未知属性
   */
  [key: string]: any
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
export type StyleProperties = string | Vitarx.HostStyleRules
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
export type ClassProperties = string | Array<any> | Record<string, boolean>

type VModelValue<T> = T extends Ref ? T : Ref<T>
type WithVModel<T extends AnyProps> = 'modelValue' extends keyof T
  ? 'modelValue' extends keyof PickRequired<T>
    ?
        | T
        | (Omit<T, 'modelValue' | 'onUpdate:modelValue'> & {
            /**
             * v-model 双向绑定
             *
             * `v-model` 模仿 Vue 的 `v-model` 双向绑定，具有相同效果，
             * 仅支持 `v-model <-> modelValue`，不兼容 `v-model:propName`。
             *
             * 示例：
             * ```tsx
             * const modelValue = ref('test')
             * <Test v-model={modelValue} />
             * // 运行时等效于如下语法
             * <Test modelValue={modelValue} onUpdate:modelValue={ v => modelValue.value = v }/>
             * ```
             */
            'v-model': VModelValue<T['modelValue']>
          })
    :
        | T
        | (Omit<T, 'modelValue' | 'onUpdate:modelValue'> & {
            /**
             * v-model 双向绑定
             *
             * `v-model` 模仿 Vue 的 `v-model` 双向绑定，具有相同效果，
             * 仅支持 `v-model <-> modelValue`，不兼容 `v-model:propName`。
             *
             * 示例：
             * ```tsx
             * const modelValue = ref('test')
             * <Test v-model={modelValue} />
             * // 运行时等效于如下语法
             * <Test modelValue={modelValue} onUpdate:modelValue={ v => modelValue.value = v }/>
             * ```
             */
            'v-model'?: VModelValue<T['modelValue']>
          })
  : T
type WithVModelUpdate<T extends AnyProps> = T & {
  /**
   * 双向绑定属性更新事件
   *
   * 组件内部使用 `useSync` | `usePropSync` 同步属性时，值变化会自动触发事件。
   *
   * @param v - 新的值
   */
  [K in keyof T & string as T extends `on${string}` ? never : `onUpdate:${K}`]?: (v: T[K]) => void
}

/**
 * 提取节点属性类型
 */
export type ExtractProps<T extends CreatableType> = T extends Dynamic
  ? DynamicProps
  : T extends Fragment
    ? FragmentProps
    : T extends HostElementTag
      ? IntrinsicElements[T]
      : T extends Component
        ? ComponentProps<T>
        : AnyProps

/**
 * createBlock 支持的属性类型推导
 *
 * 此属性类型是JSX/createBlock中可用的属性的联合类型，包括：
 * - 元素或组件定义的属性
 * - 全局属性（如key、ref、v-show等）
 */
export type ValidProps<T extends CreatableType> = ExtractProps<T> & IntrinsicAttributes

/**
 * 根据节点类型推断其对应的属性类型
 *
 * 该类型用于根据不同的节点类型 T，推断出该节点所接受的属性类型：
 * 1. 如果 T 是支持的元素名称，则返回 `ElementProps<T>` 对应的属性类型
 * 3. 如果 T 是 Fragment 类型，则返回 Fragment 对应的属性类型
 * 4. 如果 T 是 Widget 类型，则返回该组件类型的属性类型
 * 5. 其他情况返回空对象类型
 *
 * 去除了 children 属性，主要是为了编写组件Props接口时方便继承或使用其他元素/组件可透传绑定的属性。
 *
 * @example
 * ```ts
 * // 通过继承 WithNodeProps<div> 可以让组件支持所有div元素的属性，
 * // 在jsx表达式中可以获得良好的类型提示和代码补全。
 * interface MyWidgetProps extends WithProps<'div'> {
 *   children: View
 *   // ... 其他自定义属性
 * }
 * const MyWidget = (props: MyWidgetProps) => {
 *   // 使用 v-bind 绑定属性 不支持 children v-show v-if 等特殊的固有属性
 *   // 所以我们需要单独处理 children 属性
 *   return <div v-bind={props}>{props.children}</div>
 * }
 * export default MyWidget
 * ```
 *
 * @template T - 节点类型，必须继承自 ValidNodeType
 * @template K - 忽略的属性名称，默认为 'children'
 */
export type WithProps<T extends CreatableType, K extends keyof any = 'children'> = Omit<
  ExtractProps<T>,
  K
>

/**
 * 此类型工具用于提供给 JSX.LibraryManagedAttributes 使用，确保类型推导正确。
 */
export type JSXElementAttributes<C, P> = C extends Component
  ? WithVModel<WithRefProps<WithVModelUpdate<ComponentProps<C>>>>
  : P extends object
    ? WithRefProps<P>
    : {}
