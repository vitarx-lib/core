import { IS_REACTIVE, IS_READONLY, IS_REF, IS_SIGNAL } from '../constants/index.js'
import type { CallableSignal, Reactive, RefSignal, RefWrapper, Signal } from '../types/index.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj?.[IS_SIGNAL]
}

/**
 * 检查给定的值是否为可调用信号(CallableSignal)
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是可调用信号则返回true，否则返回false
 */
export function isCallableSignal(val: any): val is CallableSignal {
  // 核心信号 + typeof 为 function
  return isSignal(val) && typeof val === 'function'
}

/**
 * 判断是否为值信号（通过 .value 访问）
 **/
export function isRefSignal(val: any): val is RefSignal {
  // 核心信号 + 非函数 + 有 value 属性
  return isSignal(val) && typeof val !== 'function' && 'value' in val
}

/**
 * 判断值是否实现RefWrapper接口
 *
 * @param val - 任意值
 * @example
 * ```js
 * isRef(ref(0)) // true
 * isRef(computed(()=>0)) // true
 * isRef(toRef(0)) // true
 * isRef(toRef({k:0},'k')) // true
 *
 * isRef(0) // false
 * ```
 */
export function isRef(val: any): val is RefWrapper {
  return !!val?.[IS_REF] && 'value' in val
}

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
