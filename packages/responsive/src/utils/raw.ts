import { isObject } from '@vitarx/utils'
import { IS_RAW, RAW_VALUE } from '../constants/index.js'
import type { RawObject } from '../types/index.js'
import type { RawValue } from '../types/signal/raw.js'

/**
 * 将一个对象标记为永远不会被转换为响应式信号。
 *
 * 这在某些情况下很有用，比如当对象包含原型方法或不应该是响应式的时候。
 *
 * 标记过后它在支持深度响应的信号中不会被转换成信号。
 *
 * @template T - 待标记的对象类型
 * @param  obj - 待标记的对象，必须是一个非null的对象
 * @returns { RawObject<T> } - 返回被标记为非信号的对象
 * @throws { TypeError } - 如果传入的参数不是对象类型（比如null、undefined、数字等），则抛出类型错误
 * @example
 * ```ts
 * const obj = { value: 1 };
 * const rawObj = markNonSignal(obj);
 * const signal = reactive(rawObj); // rawObj不会被转换为响应式
 * console.log(isSignal(signal)); // false
 * ```
 */
export function markRaw<T extends object>(obj: T): RawObject<T> {
  if (!isObject(obj)) {
    throw new TypeError('[markRaw]: The argument must be an object type')
  }
  Object.defineProperty(obj, IS_RAW, {
    value: true
  })
  return obj as RawObject<T>
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
  return !!obj && !!obj[IS_RAW]
}

/**
 * 获取原始值
 *
 * @template T - 待获取原始值的对象类型
 * @param wrap - 包装原始值的对象
 * @returns - 如果传入的对象其属性存在RAW_VALUE，则返回其值，否则返回对象本身
 */
export function toRaw<T extends object>(wrap: T | RawValue<T>): T {
  if (wrap && RAW_VALUE in wrap) {
    return wrap[RAW_VALUE]
  }
  return wrap as T
}
