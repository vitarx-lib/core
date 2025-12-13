import type { Signal } from '../../types/index.js'
import { IS_SIGNAL, SIGNAL_RAW_VALUE } from './symbol.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj && !!obj[IS_SIGNAL]
}
/**
 * 获取信号原始值，不触发依赖收集
 *
 * @param sig - 信号对象
 * @returns - 信号原始值
 */
export function toRaw<T>(sig: T): T extends Signal<T> ? T : T {
  if (!isSignal(sig)) return sig as any
  if (SIGNAL_RAW_VALUE in sig) return sig[SIGNAL_RAW_VALUE] as any
  return sig as any
}

/**
 * 获取信号值并触发依赖收集
 *
 * @param sig - 信号对象
 * @returns - 信号值
 */
export function readSignal<T>(sig: Signal<T>): T extends Signal<T> ? T : T {
  if (!isSignal(sig)) return sig
  if (SIGNAL_RAW_VALUE in sig) return sig[SIGNAL_RAW_VALUE] as any
  return sig as any
}
