import { isObject } from '@vitarx/utils'
import type { Reactive } from '../../types/index.js'
import { isSignal } from '..//utils/index.js'
import { createProxyObject } from './object.js'

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
