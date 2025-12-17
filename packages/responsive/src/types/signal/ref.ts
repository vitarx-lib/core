import type { AnyObject } from '@vitarx/utils'
import type { Reactive } from './reactive.js'
import type { RawObject, Signal } from './signal.js'

/**
 * 响应式 ref 信号接口
 *
 * @template T - 信号值类型
 * @template RAW - 原始值类型
 * @interface
 */
export interface RefSignal<T = any, Deep extends boolean = true> extends Signal<RefValue<T, Deep>> {
  get value(): RefValue<T, Deep>
  set value(value: T)
}
/**
 * 响应式引用信号的值类型
 */
export type RefValue<T, Deep extends boolean = true> = Deep extends false
  ? T
  : T extends AnyObject
    ? T extends RawObject
      ? T
      : Reactive<T>
    : T

/**
 * 浅层响应式 ref 信号接口
 *
 * @template T - 响应式 ref 信号的值类型
 */
export type ShallowRef<T = any> = RefSignal<T, false>
/**
 * 类型工具 UnwrapRef，用于解包 RefSignal 类型的值
 *
 * 如果 T 是 RefSignal 类型，则返回 `RefSignal['value']`，否则直接返回 T
 *
 * @template T - 泛型参数，表示需要解包的类型
 */
export type UnwrapRef<T> = T extends RefSignal ? RefSignal['value'] : T
/**
 * 导出一个类型别名 ToRef，它根据输入类型 T 决定返回的类型
 * @template T - 任意类型
 *
 * 如果 T 是 RefSignal 类型，则返回 T 本身；否则返回 Ref<T>
 */
export type ToRef<T> = T extends RefSignal ? T : RefSignal<T>
/**
 * 只读 ref
 *
 * @template T - 值类型
 */
export interface ReadonlyRef<T> {
  get value(): T
}
