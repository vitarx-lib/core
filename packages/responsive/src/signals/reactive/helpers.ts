import { isObject } from '@vitarx/utils'
import { isRef } from '../shared/index.js'
import type { Reactive } from './base.js'
import { createReactive } from './object.js'

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
  if (isRef(target)) {
    throw new Error('Cannot reactive a ref')
  }
  return createReactive(target, deep)
}

/**
 * 创建浅层响应式对象
 *
 * 与 `reactive({},false)` 的效果是一致的。
 *
 * @template T - 目标对象类型
 * @param { T } target - 目标对象
 * @returns {Reactive<T,false>} 浅层响应式对象
 */
export function shallowReactive<T extends object>(target: T): Reactive<T, false> {
  return reactive(target, false)
}
