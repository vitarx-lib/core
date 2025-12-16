import type { AnyCollection, AnyObject } from '@vitarx/utils'
import { IS_MARK_RAW, IS_REACTIVE } from '../../signal/reactive/symbol.js'
import type { Signal } from './core.js'

/**
 * 非响应式信号
 *
 * 具有 `NON_SIGNAL` 属性标记的对象不会被识别或构造为响应式信号。
 *
 * @template T - 对象的类型
 */
export type NonReactive<T extends AnyObject = AnyObject> = T & {
  readonly [IS_MARK_RAW]: true
}
/**
 * 解包嵌套的信号值
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于解包对象属性的信号包装。
 * 如果属性值是 `Signal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Signal<string>
 *   age: number
 *   info: {
 *     address: Signal<string>
 *   }
 * }
 *
 * type UnwrappedUser = UnwrapNestedSignal<User>
 * // 等价于 { name: string; age: number; info: { address: Signal<string> } }
 * ```
 */
export type UnwrapNestedSignal<T extends AnyObject> = T extends AnyCollection
  ? T
  : {
      [K in keyof T]: T[K] extends Signal<infer U> ? U : T[K]
    }

/**
 * 深度解包嵌套信号值工具
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于递归解包对象属性的信号包装。
 * 如果属性值是 `Signal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Signal<string>
 *   age: number
 *   info: {
 *     address: Signal<string>
 *   }
 * }
 *
 * type UnwrappedUser = DeepUnwrapNestedSignal<User>
 * // 等价于 { name: string; age: number; info: { address: string } }
 * ```
 */
export type DeepUnwrapNestedSignal<T extends object> = T extends AnyCollection
  ? T
  : T extends NonReactive
    ? T
    : {
        [K in keyof T]: T[K] extends object
          ? T[K] extends Signal<infer U>
            ? U
            : DeepUnwrapNestedSignal<T[K]>
          : T[K]
      }

/**
 * 响应式代理对象类型工具
 *
 * @template T - 源对象类型
 * @template Deep - 是否进行深度解包
 * @remarks
 * 该类型用于处理代理对象。如果 `Deep` 为 `true`，则进行深度解包；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Signal<string>
 *   age: number
 * }
 *
 * type StructuralUser = ReactiveProxy<User, true>
 * // 等价于 { name: string; age: number }
 *
 * type SimpleUser = ReactiveProxy<User, false>
 * // 等价于 { name: Signal<string>; age: number }
 * ```
 */
export type ReactiveProxy<T extends AnyObject, Deep extends boolean> = T extends AnyCollection
  ? T
  : Deep extends true
    ? DeepUnwrapNestedSignal<T>
    : UnwrapNestedSignal<T>

/**
 * 响应式信号接口
 *
 * 这是一个抽象接口，用于描述响应式信号对象。
 *
 * @template T - 信号值类型
 * @template Deep - 是否进行深度解包
 * @remarks
 * 该接口继承自 `Signal` 接口，并添加了 `[IS_REACTIVE_SIGNAL]` 属性，用于标记响应式信号。
 *
 * @example
 * ```typescript
 * const user = reactive({
 *   name: 'John',
 *   age: signal(18),
 *   gender: ref('male'),
 * })
 *
 * console.log(user.name) // John
 * console.log(user.age) // 18
 * console.log(user.gender) // male
 * ```
 */
export type Reactive<T extends AnyObject = any, Deep extends boolean = true> = ReactiveProxy<
  T,
  Deep
> &
  Signal<ReactiveProxy<T, Deep>, T> & {
    [IS_REACTIVE]: true
  }

/**
 * 集合信号
 *
 * 这是一个抽象接口，用于描述集合信号对象。
 */
export type CollectionSignal<T extends AnyCollection> = T & Signal<T, T>
/**
 * 响应式信号接口
 *
 * 这是一个抽象接口，用于描述响应式对象。
 *
 * @template T - 集合类型
 * @remarks
 * 该接口继承自 `Signal` 接口，并添加了 `[IS_REACTIVE_SIGNAL]` 属性，用于标记响应式对象。
 */
export type ReactiveSignal<T extends AnyObject = any, Deep extends boolean = true> = ReactiveProxy<
  T,
  Deep
> &
  Signal<ReactiveProxy<T, Deep>, T> & {
    [IS_REACTIVE]: true
  }
