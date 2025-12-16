import { isObject } from '@vitarx/utils'
import type { NonReactive, Reactive } from '../../types/index.js'
import { isSignal } from '../core/index.js'
import type { ReactiveSignal } from './proxy/base.js'
import { createProxyObject } from './proxy/object.js'
import { IS_MARK_RAW, IS_REACTIVE } from './symbol.js'

/**
 * 将一个对象标记为永远不会被转换为响应式信号。
 *
 * 这在某些情况下很有用，比如当对象包含原型方法或不应该是响应式的时候。
 *
 * 标记过后它在支持深度响应的信号中不会被转换成信号。
 *
 * @template T - 待标记的对象类型
 * @param  obj - 待标记的对象，必须是一个非null的对象
 * @returns { NonReactive<T> } - 返回被标记为非信号的对象
 * @throws { TypeError } - 如果传入的参数不是对象类型（比如null、undefined、数字等），则抛出类型错误
 * @example
 * ```ts
 * const obj = { value: 1 };
 * const rawObj = markNonSignal(obj);
 * const signal = reactive(rawObj); // rawObj不会被转换为响应式
 * console.log(isSignal(signal)); // false
 * ```
 */
export function markRaw<T extends object>(obj: T): NonReactive<T> {
  if (!isObject(obj)) {
    throw new TypeError('[markNonSignal]: The argument must be an object type')
  }
  Object.defineProperty(obj, IS_MARK_RAW, {
    value: true
  })
  return obj as NonReactive<T>
}
/**
 * 检查对象是否被标记为非信号类型
 *
 * @param obj - 需要检查的对象
 * @returns {boolean} 如果对象存在且具有NON_SIGNAL属性则返回true，否则返回false
 */
export function isMakeRaw(obj: any): boolean {
  // 使用!!操作符将对象和其NON_SIGNAL属性转换为布尔值
  // 只有当对象和其NON_SIGNAL属性都存在时才返回true
  return !!obj && !!obj[IS_MARK_RAW]
}
/**
 * 检查对象是否为代理对象
 *
 * @param val - 待检查的对象
 * @returns {boolean} 如果是对象且具有IS_PROXY属性则返回true，否则返回false
 */
export function isProxy(val: any): boolean {
  return isReactive(val)
}
/**
 * 检查一个值是否为响应式对象
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果是响应式对象则返回true，否则返回false
 */
export function isReactive(val: any): val is Reactive {
  // 首先确保val不为null或undefined，然后检查其是否具有IS_REACTIVE属性
  return !!val && !!val[IS_REACTIVE]
}
/**
 * 获取代理原始值
 *
 * @returns - 信号原始值
 * @param val - 待获取原始值的对象
 */
export function toRaw<T extends object>(val: T | Reactive<T>): T {
  if (isReactive(val)) {
    return ((val as any)[IS_REACTIVE] as ReactiveSignal<any>).target
  }
  return val
}
/**
 * 将一个对象代理为响应式对象
 *
 * @template T - 任意对象类型
 * @param target - 需要转换为响应式的目标对象，不要传入集合对象，集合
 * @param [deep=true] - 深度响应式配置
 * @returns {T} 返回一个响应式代理对象
 */
export function reactive<T extends object, Deep extends boolean = true>(
  target: T,
  deep?: Deep
): Reactive<T, Deep> {
  if (!isObject(target)) {
    throw new Error('Cannot reactive a non-object')
  }
  if (isSignal(target)) {
    throw new Error('Cannot reactive a signal')
  }
  return createProxyObject(target, deep)
}
