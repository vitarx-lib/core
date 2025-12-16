import type { AnyObject } from '@vitarx/utils'
import type { NonSignal, Signal } from './core.js'
import type { Reactive } from './reactive.js'

/**
 * 响应式 ref 信号接口
 *
 * @template T - 信号值类型
 * @template RAW - 原始值类型
 * @interface
 */
export interface RefSignal<T = any, Deep extends boolean = true>
  extends Signal<RefValue<T, Deep>, T> {
  get value(): T
  set value(value: T)
}

/**
 * 响应式引用信号的值类型
 */
export type RefValue<T, Deep extends boolean = true> = Deep extends false
  ? T
  : T extends AnyObject
    ? T extends NonSignal
      ? T
      : T extends Signal
        ? T
        : Reactive<T>
    : T
