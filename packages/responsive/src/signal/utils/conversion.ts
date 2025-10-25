import { SIGNAL_RAW_VALUE_SYMBOL } from '../constants.js'
import type { ProxySignal, RefSignal } from '../types/index.js'
import { isSignal } from './verify.js'

/**
 * 信号转换为原始对象的类型
 *
 * @template T - 信号类型
 */
export type SignalToRaw<T> =
  T extends RefSignal<any, infer U> ? U : T extends ProxySignal<infer U> ? U : T

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
 * // 用于获取ref引用信号的原始值
 * const signal = ref(1)
 * const rawValue = toRaw(signal) // 1
 *
 * // 用于获取reactive代理信号的原始值
 * const proxySignal = reactive({ count: 0 })
 * const rawValue = toRaw(proxySignal) // { count: 0 }
 *
 * // 用于获取computed计算信号的原始值
 * const computedSignal = computed(() => proxySignal.count)
 * const rawValue = toRaw(computedSignal) // 0
 *
 * // 对于非响应式值，直接返回原值
 * const plainValue = 'any'
 * console.log(toRaw(plainValue)) // 输出: any
 * ```
 */
export function toRaw<T>(signal: T): SignalToRaw<T> {
  if (isSignal(signal)) {
    return (signal as any)[SIGNAL_RAW_VALUE_SYMBOL]
  }
  return signal as SignalToRaw<T>
}
