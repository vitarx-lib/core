import { AnyObject, isObject } from '@vitarx/utils'
import type { NonSignal, Signal } from '../../types/index.js'
import { IS_NON_SIGNAL, IS_SIGNAL, SIGNAL_RAW_VALUE, SIGNAL_VALUE } from './symbol.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj && !!obj[IS_SIGNAL]
}
/**
 * 获取信号原始值 - 不触发跟踪
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
 * 获取信号值的辅助函数 - 跟踪信号
 *
 * @alias getSignal
 * @param sig - 信号对象
 * @returns {any} - 如果是信号对象，则返回信号值；否则返回原值
 */
export function readSignal<T>(sig: Signal<T>): T extends Signal<T> ? T : T {
  if (!isSignal(sig)) return sig
  if (SIGNAL_VALUE in sig) return sig[SIGNAL_VALUE] as any
  return sig as any
}
/**
 * 写入信号值的辅助函数 - 触发信号
 *
 * @alias setSignal
 * @param sig - 要设置的信号对象
 * @param value - 要设置的新值
 */
export function writeSignal<T>(sig: Signal<T>, value: T): void {
  sig[SIGNAL_VALUE] = value
}
export { readSignal as getSignal, writeSignal as setSignal }

/**
 * 将一个对象标记为永远不会被转换为响应式信号。
 *
 * 这在某些情况下很有用，比如当对象包含原型方法或不应该是响应式的时候。
 *
 * 标记过后它在支持深度响应的信号中不会被转换成信号。
 *
 * @template T - 待标记的对象类型
 * @param { AnyObject } obj - 待标记的对象，必须是一个非null的对象
 * @returns { NonSignal<T> } - 返回被标记为非信号的对象
 * @throws { TypeError } - 如果传入的参数不是对象类型（比如null、undefined、数字等），则抛出类型错误
 * @example
 * ```ts
 * const obj = { value: 1 };
 * const rawObj = markNonSignal(obj);
 * const signal = reactive(rawObj); // rawObj不会被转换为响应式
 * console.log(isSignal(signal)); // false
 * ```
 */
export function markNonSignal<T extends object>(obj: T): NonSignal<T> {
  if (!isObject(obj)) {
    throw new TypeError('[markNonSignal]: The argument must be an object type')
  }
  Object.defineProperty(obj, IS_NON_SIGNAL, {
    value: true
  })
  return obj as NonSignal<T>
}

export { markNonSignal as markRaw }

/**
 * 检查对象是否被标记为非信号类型
 *
 * @param obj - 需要检查的对象
 * @returns {boolean} 如果对象存在且具有NON_SIGNAL属性则返回true，否则返回false
 */
export function isMarkNonSignal(obj: any): boolean {
  // 使用!!操作符将对象和其NON_SIGNAL属性转换为布尔值
  // 只有当对象和其NON_SIGNAL属性都存在时才返回true
  return !!obj && !!obj[IS_NON_SIGNAL]
}

export { isMarkNonSignal as isRaw }
