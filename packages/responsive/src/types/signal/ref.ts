import type { AnyObject } from '@vitarx/utils'
import type { IS_REF } from '../../constants/index.js'
import type { RawObject, Reactive } from './reactive.js'
import type { Signal } from './signal.js'

/**
 * 响应式引用信号的值类型
 *
 * 根据是否启用深层响应式，决定值的类型：
 * - 浅层响应式：直接返回原始值类型 T
 * - 深层响应式：对于对象类型，会将其转换为响应式代理对象
 *
 * @template T - 原始值类型
 * @template IsDeep - 是否启用深层响应式，默认为 true
 *
 * @example
 * ```typescript
 * // 浅层响应式
 * type ShallowValue = RefValue<{ name: string }, false> // { name: string }
 *
 * // 深层响应式
 * type DeepValue = RefValue<{ name: string }, true> // Reactive<{ name: string }>
 * ```
 */
export type RefValue<T, IsDeep extends boolean = true> = IsDeep extends false
  ? T
  : T extends AnyObject
    ? T extends RawObject | Signal
      ? T
      : Reactive<T>
    : T
/**
 * 只读 ref 接口
 *
 * 只读版本的 ref，只能读取值但不能修改。
 * 通常由 toRef 工具转换而来。
 *
 * @template T - 值类型
 *
 * @example
 * ```typescript
 * const count = ref(1)
 * const doubled = toRef(() => count.value * 2) // ReadonlyRef<number>
 *
 * console.log(doubled.value) // 2
 * // doubled.value = 3 // 错误：无法分配到 "value" ，因为它是只读属性
 * ```
 */
export interface ReadonlyRef<T = any> {
  readonly [IS_REF]: true
  readonly value: T
}

/**
 * 可写 ref 接口
 *
 * 扩展了只读 ref，增加了写入能力。
 * 这是大多数 ref 实现的基础接口。
 *
 * @template T - 值类型
 *
 * @example
 * ```typescript
 * const data = reactive({a:0})
 * const count: RefWrapper<number> = toRef(data,'a')
 *
 * // 读取值
 * console.log(count.value) // 0
 *
 * // 修改值
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export interface RefWrapper<T = any> {
  readonly [IS_REF]: true
  value: T
}

/**
 * 类型工具 UnwrapRef，用于解包 RefWrapper 类型的值
 *
 * 如果 T 继承于 ReadonlyRef 类型，则返回其包装的值类型；
 * 否则直接返回 T 本身。
 *
 * @template T - 泛型参数，表示需要解包的类型
 *
 * @example
 * ```typescript
 * type A = UnwrapRef<ReadonlyRef<string>> // string
 * type B = UnwrapRef<number> // number
 * type C = UnwrapRef<WritableRef<boolean>> // boolean
 * ```
 */
export type UnwrapRef<T> = T extends RefWrapper<infer V> ? V : T

/**
 * ToRef 类型工具，它根据输入类型 T 转换类型
 *
 * 如果 T 已经具有 REF_SYMBOL 标记（即已经是 ref 类型），
 * 则返回 T 本身；否则返回 WritableRef<T>。
 *
 * @template T - 任意类型
 *
 * @example
 * ```typescript
 * type A = ToRef<number> // WritableRef<number>
 * type B = ToRef<ReadonlyRef<string>> // ReadonlyRef<string>
 * type C = ToRef<WritableRef<boolean>> // WritableRef<boolean>
 * ```
 */
export type ToRef<T> = T extends RefWrapper ? T : RefWrapper<T>
