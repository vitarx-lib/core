import { AnyObject } from '@vitarx/utils'
import type { BaseSignal, NotSignal, ProxySignal, RefSignal } from '../../core/index.js'

/**
 * 解包嵌套的响应式信号值
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于递归解包对象中所有的响应式信号值。如果属性值是 `RefSignal` 类型，
 * 则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: RefSignal<string>
 *   age: number
 * }
 *
 * type UnwrappedUser = UnwrapNestedRefs<User>
 * // 等价于 { name: string; age: number }
 * ```
 */
export type UnwrapNestedRefs<T extends AnyObject> = {
  [K in keyof T]: T[K] extends NotSignal ? T[K] : T[K] extends RefSignal<infer U> ? U : T[K]
}

/**
 * 响应式引用信号的值类型
 */
export type RefValue<T, Deep extends boolean = true> = Deep extends false
  ? T
  : T extends AnyObject
    ? T extends NotSignal
      ? T
      : T extends BaseSignal
        ? T
        : ProxySignal<T, UnwrapNestedRefs<T>, Deep>
    : T
