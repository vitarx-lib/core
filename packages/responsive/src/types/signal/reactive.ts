import type { AnyCollection, AnyObject } from '@vitarx/utils'
import type { REACTIVE_SYMBOL } from '../../constants/index.js'
import type { BaseReactive } from '../../signal/reactive/base.js'
import type { DeepUnwrapNestedSignal, UnwrapNestedSignal } from './signal.js'

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
  [REACTIVE_SYMBOL]: BaseReactive<T, Deep>
}
