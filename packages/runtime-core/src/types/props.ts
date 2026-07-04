import type { Ref } from '@vitarx/responsive'
import { type PickRequired, RequiredKeys } from '@vitarx/utils'
import type { Dynamic, DynamicProps, Fragment, FragmentProps } from '../view/index.js'
import type { AnyProps, Component } from './component.js'
import type { HostElementTag, IntrinsicElements } from './element.js'
import type { ViewDescriptor } from './view.js'

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
export type MaybeRef<T> = T extends Ref<infer U, any> ? U | T : T | Ref<T, never>

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
export type BindAttributes =
  | { [key: string]: any }
  | [props: { [key: string]: any }, exclude?: string[]]

/**
 * 实例引用
 */
export type InstanceRef<T = unknown> = Ref<T | null>

type VModelValue<T> = T extends Ref<any, infer S> ? T | S : Ref<T> | T
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

/**
 * 根据视图标签类型推断其对应的属性类型
 *
 * @example
 * ```ts
 * // 通过继承 WithProps<div> 可以让组件支持所有div元素的属性，
 * interface Props extends WithProps<'div'> {
 *   // ... 其他自定义属性
 * }
 * const MyComponent = (props: Props) => {
 *   return <div v-bind={props}>{props.children}</div>
 * }
 * export default MyComponent
 * ```
 *
 * @template T - 节点类型，必须继承自 ViewTag
 */
export type WithProps<T extends ViewDescriptor> = ExtractProps<T>

/**
 * 应用组件默认值类型
 *
 * @template C - 组件类型
 * @template P - 组件的属性类型
 */
export type WithDefaultProps<C extends { defaultProps?: AnyProps }, P extends AnyProps> =
  'defaultProps' extends RequiredKeys<C>
    ? Omit<P, keyof C['defaultProps']> & {
        [K in keyof C['defaultProps'] as K extends keyof P ? K : never]?: K extends keyof P
          ? P[K]
          : never
      }
    : P

/**
 * 组件属性类型
 */
export type ComponentProps<C extends Component> =
  C extends Component<infer P> ? WithDefaultProps<C, P> : {}

/**
 * 提取视图属性
 *
 * @template T - 视图标签类型，必须继承自 ViewTag
 */
type ExtractProps<T extends ViewDescriptor> = T extends Dynamic
  ? DynamicProps
  : T extends Fragment
    ? FragmentProps
    : T extends HostElementTag
      ? IntrinsicElements[T]
      : T extends Component
        ? ComponentProps<T>
        : AnyProps
/**
 * 支持的全局属性
 */
export interface VitarxIntrinsicAttributes {
  /**
   * 引用组件/元素实例
   */
  ref?: InstanceRef<any>
  /**
   * 绑定属性
   *
   * 注意：不能通过 `v-bind` 指令绑定全局属性(ref、children...)。
   *
   * 可选值：
   *  - { [key: string]: unknown }：要绑定给元素的属性，`style`|`class`|`className`，会和原有值进行合并。
   *  - [props: { [key: string]: unknown }, exclude?: string[]]：第一个元素为要绑定给节点的属性对象，
   *  第二个元素可以指定哪些属性不需要绑定。
   */
  'v-bind'?: BindAttributes | null | undefined
}

/**
 * InferProps类型工具，用于推断 createView 可接受的属性类型
 *
 * @template T - 视图标签类型，必须继承自 ViewDescriptor
 */
export type InferProps<T extends ViewDescriptor> = ExtractProps<T> & VitarxIntrinsicAttributes

/**
 * 组件属性类型拓展
 *
 * @template C - 组件类型
 * @template P - 组件的默认属性类型
 */
export type VitarxManagedAttributes<C, P> = C extends Component
  ? P extends AnyProps
    ? WithVModel<WithRefProps<WithDefaultProps<C, P>>>
    : AnyProps
  : P
