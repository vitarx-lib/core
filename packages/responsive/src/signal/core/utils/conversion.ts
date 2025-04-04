import { GET_RAW_TARGET_SYMBOL } from '../constants'
import type { BaseSignal, SignalToRaw } from '../types/index'

/**
 * 将信号转换为原始值
 *
 * @template T - 信号类型
 * @param {T} signal - 信号对象
 * @returns {SignalToRaw<T>} 原始值
 */
export function toRaw<T extends BaseSignal>(signal: T): SignalToRaw<T> {
  return (Reflect.get(signal, GET_RAW_TARGET_SYMBOL) ?? signal) as SignalToRaw<T>
}
