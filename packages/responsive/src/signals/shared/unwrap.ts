import { isRef } from './is.js'
import type { Ref } from './types.js'

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
export function unref<T>(ref: Ref<T> | T): T {
  return isRef(ref) ? ref.value : ref
}
