import { IS_REACTIVE, IS_READONLY, IS_REF_SIGNAL, IS_SIGNAL } from '../../constants/index.js'
import type { Reactive, RefSignal, Signal } from '../../types/index.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj?.[IS_SIGNAL]
}

/**
 * 判断是否为 Ref 对象
 *
 * @param val - 任意值
 * @example
 * ```js
 * isRef(ref(0)) // true
 * isRef(0) // false
 * ```
 */
export function isRef(val: any): val is RefSignal<any, boolean> {
  return !!val?.[IS_REF_SIGNAL]
}
export { isRef as isRefSignal }

/**
 * 检查一个值是否为响应式对象
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是响应式对象则返回true，否则返回false
 */
export function isReactive(val: any): val is Reactive<any, boolean> {
  // 首先确保val不为null或undefined，然后检查其是否具有IS_REACTIVE属性
  return !!val?.[IS_REACTIVE]
}

/**
 * 判断是否为只读对象
 *
 * 检查一个值是否是通过 `readonly()` 或 `shallowReadonly()` 创建的只读代理对象。
 * 注意：此函数仅检查对象是否为只读代理，不能用于判断对象是否为响应式对象。
 *
 * @template T - 要检查的对象类型
 * @param {T} obj - 要检查的对象
 * @returns {boolean} 如果对象是只读代理则返回true，否则返回false
 * @example
 * ```ts
 * const original = { count: 0 }
 * const readonlyObj = readonly(original)
 * const shallowReadonlyObj = shallowReadonly(original)
 *
 * isReadonly(readonlyObj) // true
 * isReadonly(shallowReadonlyObj) // true
 * isReadonly(original) // false
 * isReadonly(null) // false
 * ```
 */
export function isReadonly(obj: any): boolean {
  return obj?.[IS_READONLY] === true
}
