import { SIGNAL_CURRENT, SIGNAL_PEEK } from '../../constants/index.js'
import type { Signal, UnwrapRef } from '../../types/index.js'
import { isRef, isSignal } from './is.js'

/**
 * 获取信号值的辅助函数
 *
 * @alias getSignal
 * @param sig - 信号对象
 * @returns {any} - 如果是信号对象，则返回信号值；否则返回原值
 */
export function readSignal<T>(sig: Signal<T> | T): T {
  if (!isSignal(sig)) return sig
  return sig[SIGNAL_CURRENT]
}
export { readSignal as getSignal }

/**
 * 将指定的值写入到信号对象中
 *
 * @alias setSignal
 * @param sig - 要写入的信号对象
 * @param value - 要写入的值
 * @returns - 如果传入的对象不是信号，则直接返回该对象
 */
export function writeSignal<T>(sig: Signal<T>, value: T): void {
  // 检查传入的对象是否为信号
  if (!isSignal(sig)) return sig
  // 更新信号对象的当前值
  sig[SIGNAL_CURRENT] = value
}
export { writeSignal as setSignal }

/**
 * 查看信号的当前值而不触发订阅
 *
 * @param sig - 可以是Signal对象或任意值T
 * @returns - 如果输入是Signal则返回其当前值，否则直接返回输入值
 */
export function peekSignal<T>(sig: Signal<T> | T): T {
  // 检查输入是否为Signal对象
  if (!isSignal(sig)) return sig
  // 如果是Signal，则返回其peek属性值
  return sig[SIGNAL_PEEK]
}

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
