import type { Signal } from '../../types/index.js'
import { IS_SIGNAL, SIGNAL_VALUE } from './symbol.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj && !!obj[IS_SIGNAL]
}

/**
 * 获取信号值的辅助函数 - 跟踪信号
 *
 * @alias getSignal
 * @param sig - 信号对象
 * @returns {any} - 如果是信号对象，则返回信号值；否则返回原值
 */
export function readSignal<T>(sig: Signal<T> | T): T {
  if (!isSignal(sig)) return sig as any
  if (SIGNAL_VALUE in sig) return sig[SIGNAL_VALUE] as any
  return sig as any
}
export { readSignal as getSignal }
