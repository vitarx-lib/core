import { type AnyPrimitive } from '@vitarx/utils/src/index.js'
import type { View } from '../../types/index.js'
import { ViewRef } from './ref.js'

/**
 * 转换视图表达式，用于观察和响应数据变化
 *
 * @internal 此 API 提供给编译器使用，开发者无需使用。
 *
 * @param getter - 一个返回视图对象或基本类型的函数
 * @returns - 返回一个ViewRef对象或视图对象的直接值，取决于是否有动态变化
 */
export function viewExpr<T extends View>(getter: () => T | AnyPrimitive): T | ViewRef<T> {
  // 创建一个新的ViewRef实例，传入getter函数
  const r = new ViewRef(getter)
  // 检查是否有动态变化，如果有则返回ViewRef对象，否则返回直接值
  return r.hasDynamic ? r : r.value
}
