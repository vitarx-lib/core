import type { AnySignal, RefWrapper } from '../types/index.js'
import { isCallableSignal, isRef } from './is.js'

/**
 * 解包 ref 包装，返回其 `.value` 值；普通值原样返回。
 *
 * @param ref - 包装对象或普通值
 * @example
 * ```js
 * unref(ref(0)) // 0
 * unref(100) // 100
 * ```
 */
export function unref<T>(ref: RefWrapper<T> | T): T {
  return isRef(ref) ? ref.value : ref
}
/**
 * 解包函数，用于处理可能被包装的值
 *
 * @template T - 泛型类型，表示值的类型
 * @param val - 需要解包的值，可能是RefWrapper、AnySignal或直接值
 * @returns - 返回解包后的原始值 T
 */
export function unwrap<T>(val: RefWrapper<T> | AnySignal<T> | T): T {
  if (isRef(val)) return val.value
  if (isCallableSignal(val)) return val()
  return val
}
