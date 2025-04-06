import { isObject } from '@vitarx/utils'
import { SIGNAL_RAW_VALUE_SYMBOL } from '../constants'
import type { ProxySignal, RefSignal } from '../types/index'

/**
 * 信号转换为原始对象的类型
 *
 * @template T - 信号类型
 */
export type SignalToRaw<T> =
  T extends RefSignal<unknown, infer U> ? U : T extends ProxySignal<infer U> ? U : T

/**
 * 将响应式信号对象转换为其原始值。
 *
 * 在响应式系统中，该函数用于获取信号对象内部存储的原始数据，
 * 不会触发依赖收集，常用于需要直接访问或操作原始数据的场景。
 *
 * @template T - 信号类型，可以是任意类型
 * @param {T} signal - 需要转换的信号对象。如果是响应式对象，将返回其原始值；如果是普通值，则直接返回
 * @returns {SignalToRaw<T>} 返回信号对象对应的原始值。如果输入是响应式对象，返回其内部的原始数据；
 * 如果输入是普通值，则原样返回
 *
 * @example
 * ```ts
 * const signal = ref({ count: 0 })
 * const rawValue = toRaw(signal) // 获取原始对象 { count: 0 }
 *
 * // 对于非响应式值，直接返回原值
 * const plainValue = 100
 * console.log(toRaw(plainValue)) // 输出: 100
 * ```
 */
export function toRaw<T>(signal: T): SignalToRaw<T> {
  if (isObject(signal)) {
    return (Reflect.get(signal, SIGNAL_RAW_VALUE_SYMBOL) ?? signal) as SignalToRaw<T>
  }
  return signal as SignalToRaw<T>
}
