import {
  CALLABLE_SIGNAL_SYMBOL,
  REACTIVE_SYMBOL,
  READONLY_SYMBOL,
  REF_SYMBOL,
  SIGNAL_SYMBOL
} from '../../constants/index.js'
import type { Reactive, RefSignal, Signal } from '../../types/index.js'
import type { CallableSignal } from '../callable/index.js'

/**
 * 判断对象是否是 Signal
 */
export function isSignal(obj: any): obj is Signal {
  return !!obj?.[SIGNAL_SYMBOL]
}
/**
 * 检查给定的值是否为可调用信号(CallableSignal)
 * 这个函数通过检查值上是否存在特定的符号属性来判断
 *
 * @param val - 需要检查的任意值
 * @returns {boolean} 如果值是可调用信号则返回true，否则返回false
 */
export function isCallableSignal(val: any): val is CallableSignal {
  // 使用可选链操作符检查值是否存在且具有CALLABLE_SIGNAL_SYMBOL属性
  // 双感叹号将结果转换为布尔值
  return !!val?.[CALLABLE_SIGNAL_SYMBOL]
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
  return !!val?.[REF_SYMBOL]
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
  return !!val?.[REACTIVE_SYMBOL]
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
  return obj?.[READONLY_SYMBOL] === true
}
