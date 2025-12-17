import { SIGNAL_VALUE } from '../../constants/index.js'
import type { Signal, UnwrapRef } from '../../types/index.js'
import { isRef, isSignal } from './is.js'

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

/**
 * 解包 Ref 对象，返回其 `.value` 值；普通值原样返回
 *
 * @param ref - Ref 对象或普通值
 * @example
 * ```js
 * unref(ref(0)) // 0
 * unref(100) // 100
 * ```
 */
export function unref<T>(ref: T): UnwrapRef<T> {
  return isRef(ref) ? ref.value : (ref as any)
}
