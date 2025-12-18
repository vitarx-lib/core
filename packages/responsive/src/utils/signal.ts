import type { AnySignal } from '../types/index.js'
import { isSignal } from './is.js'

/**
 * 获取信号值的辅助函数
 *
 * @alias getSignal
 * @param sig - 信号对象
 * @returns {any} - 如果是信号对象，则返回信号值；否则返回原值
 */
export function readSignal<T>(sig: AnySignal<T> | T): T {
  if (!isSignal(sig)) return sig
  if (typeof sig === 'function') return sig()
  return sig.value
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
export function writeSignal<T>(sig: AnySignal<any, T>, value: T): void {
  // 检查传入的对象是否为信号
  if (!isSignal(sig)) return void 0
  if (typeof sig === 'function') {
    sig(value)
  } else {
    sig.value = value
  }
}
export { writeSignal as setSignal }
