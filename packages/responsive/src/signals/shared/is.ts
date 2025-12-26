import type { Reactive, ShallowReactive } from '../reactive/base.js'
import { IS_REACTIVE, IS_READONLY, IS_REF, IS_SIGNAL } from './symbol.js'
import type { Ref, RefSignal } from './types.js'

/**
 * 判断值是否实现Ref接口
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
export function isRef(val: any): val is Ref {
  return !!val?.[IS_REF] && 'value' in val
}
/**
 * 检测值是否为RefSignal
 *
 * @param val - 待检测的值
 * @returns {boolean} 如果是RefSignal则返回true，否则返回false
 */
export function isRefSignal(val: any): val is RefSignal {
  return isRef(val) && (val as any)[IS_SIGNAL] === true
}
/**
 * 检查一个值是否为响应式对象
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是响应式对象则返回true，否则返回false
 */
export function isReactive(val: any): val is Reactive | ShallowReactive {
  // 首先确保val不为null或undefined，然后检查其是否具有IS_REACTIVE属性
  return !!val?.[IS_REACTIVE]
}
/**
 * 判断是否为只读对象
 *
 * 检查一个值是否是通过 `readonly()` 或 `shallowReadonly()` 或 `toRef(()=>value)` 创建的只读对象。
 * 注意：此函数仅检查对象是否为具有只读标记，不能用于判断对象是否为响应式对象。
 *
 * @template T - 要检查的对象类型
 * @param {T} obj - 要检查的对象
 * @returns {boolean} 如果对象是只读代理则返回true，否则返回false
 * @example
 * ```ts
 * const original = { count: 0 }
 * const readonlyObj = readonly(original)
 * const shallowReadonlyObj = shallowReadonly(original)
 * const toRefObj = toRef(() => original.count)
 *
 * isReadonly(readonlyObj) // true
 * isReadonly(shallowReadonlyObj) // true
 * isReadonly(toRefObj) // true
 * isReadonly(original) // false
 * isReadonly(null) // false
 * ```
 */
export function isReadonly(obj: any): boolean {
  return obj?.[IS_READONLY] === true
}
