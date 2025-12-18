import type { AnyCollection, AnyFunction, AnyObject } from '@vitarx/utils'
import { IS_RAW, type IS_REACTIVE } from '../../constants/index.js'
import type { ReactiveSource } from '../../signal/reactive/base.js'
import type { RefWrapper } from './ref.js'
import type { CallableSignal } from './signal.js'

/**
 * 原始对象标记
 *
 * 具有 `RAW_SYMBOL` 属性标记的对象不会被识别或构造为响应式信号。
 *
 * @template T - 对象的类型
 */
export type RawObject<T extends AnyObject = AnyObject> = T & {
  readonly [IS_RAW]: true
}
/**
 * 不需要包装的数据类型
 */
type NonWarped = AnyCollection | AnyFunction | RawObject

/**
 * 解包嵌套的信号值
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于解包对象属性的信号包装。
 * 如果属性值是 `Ref | CallableSignal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Ref<string>
 *   age: number
 *   info: {
 *     address: CallableSignal<string>
 *   }
 * }
 *
 * type UnwrappedUser = UnwrapNestedRefs<User>
 * // 等价于 { name: string; age: number; info: { address: Signal<string> } }
 * ```
 */
type UnwrapReactiveValues<T extends AnyObject> = T extends NonWarped
  ? T
  : {
      [K in keyof T]: T[K] extends RefWrapper<T> | CallableSignal<infer V, any> ? V : T[K]
    }
/**
 * 深度解包嵌套信号值工具
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于递归解包对象属性的信号包装。
 * 如果属性值是 `Ref | CallableSignal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Ref<string>
 *   age: number
 *   info: {
 *     address: CallableSignal<string>
 *   }
 * }
 *
 * type UnwrappedUser = DeepUnwrapNestedRefs<User>
 * // 等价于 { name: string; age: number; info: { address: string } }
 * ```
 */
type DeepUnwrapReactiveValues<T extends object> = T extends NonWarped
  ? T
  : {
      [K in keyof T]: T[K] extends object
        ? T[K] extends RefWrapper<infer V> | CallableSignal<infer V, any>
          ? V
          : DeepUnwrapReactiveValues<T[K]>
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
type ReactiveProxy<T extends AnyObject, Deep extends boolean> = T extends AnyCollection
  ? T
  : Deep extends true
    ? DeepUnwrapReactiveValues<T>
    : UnwrapReactiveValues<T>

/**
 * 响应式代理对象接口
 *
 * 这是一个抽象接口，用于描述响应式信号对象。
 *
 * @template T - 信号值类型
 * @template Deep - 是否进行深度解包
 * @remarks
 * 该接口继承自 `Signal` 接口，并添加了 `[IS_REACTIVE]` 属性，用于标记响应式信号。
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
> & {
  [IS_REACTIVE]: ReactiveSource<T, Deep>
}
