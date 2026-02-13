import type { Ref } from '@vitarx/responsive'
import type { PickRequired } from '@vitarx/utils'
import type { Dynamic, DynamicProps, Fragment, FragmentProps, ViewBuilder } from '../view/index.js'
import type { AnyProps, Component, ComponentProps } from './component.js'
import type { HostElementTag, IntrinsicElements } from './element.js'
import type { ViewTag } from './view.js'

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
 * 绑定属性
 *
 * 可选值：
 *   - 对象Record<string, any>：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
 *   - 数组[props: Record<string, any>, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，第二个元素可以指定哪些属性不需要绑定。
 */
export type BindAttributes = Record<string, any> | [props: Record<string, any>, exclude?: string[]]

/**
 * 实例引用
 */
export type InstanceRef<T = unknown> = Ref<T | null> | ((el: T) => void)
/**
 * 支持的全局属性
 */
export interface IntrinsicAttributes {
  /**
   * 引用组件/元素实例
   */
  ref?: InstanceRef
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
export type StyleRules = Vitarx.HostCSSProperties

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
   * 组件内部使用 `useModel` 同步属性时，值变化会自动触发事件。
   *
   * @param v - 新的值
   */
  [K in keyof T & string as T extends `on${string}` ? never : `onUpdate:${K}`]?: (v: T[K]) => void
}

/**
 * 提取节点属性类型
 */
export type ExtractProps<T extends ViewTag> = T extends Dynamic
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
export type ValidProps<T extends ViewTag> = ExtractProps<T> & IntrinsicAttributes

/**
 * 根据视图标签类型推断其对应的属性类型
 *
 * 去除了 children 属性，主要是为了编写组件Props接口时方便继承或使用其他元素/组件可透传绑定的属性。
 *
 * @example
 * ```ts
 * // 通过继承 WithProps<div> 可以让组件支持所有div元素的属性，
 * interface Props extends WithProps<'div'> {
 *   children: View
 *   // ... 其他自定义属性
 * }
 * const MyComponent = (props: Props) => {
 *   return <div v-bind={props}>{props.children}</div>
 * }
 * export default MyComponent
 * ```
 *
 * @template T - 节点类型，必须继承自 ViewTag
 * @template K - 忽略的属性名称，默认为 'children'
 */
export type WithProps<T extends ViewTag, K extends keyof any = 'children'> = Omit<
  ExtractProps<T>,
  K
>

export type JSXElementAttributes<C, P> = P extends object
  ? WithVModel<WithRefProps<WithVModelUpdate<P>>>
  : C extends ViewBuilder<infer U>
    ? WithVModel<WithRefProps<WithVModelUpdate<U>>>
    : {}
