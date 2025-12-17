import { isPlainObject } from '@vitarx/utils'
import type { ReadonlyRef, ToRef } from '../../types/index.js'
import { PropertyRef, Ref } from '../ref/index.js'
import { isReactive, isRef } from './is.js'

/**
 * 转换为 ReadonlyRef
 *
 * @overload
 * 当传入函数时，返回一个只读 ReadonlyRef，.value 通过 getter 访问源的返回值。
 * @template T - 值的类型
 * @param {() => T} source - 一个返回值的函数
 * @returns {ReadonlyRef<T>} ReadonlyRef 对象
 * @example
 * ```js
 * const data = reactive({ count: 0 })
 * const countRef = toRef(() => data.count)
 * console.log(countRef.value) // 0
 * ```
 */
export function toRef<T>(source: () => T): ReadonlyRef<T>

/**
 * 常规转换为 Ref
 *
 * @overload
 * 当传入任意普通值时，包装为可写的 Ref
 * @template T - 值的类型
 * @param {T} value - 普通值
 * @returns {Ref<T>} 包装后的 Ref 对象
 * @example
 * ```js
 * const countRef = toRef(42)
 * console.log(countRef.value) // 42
 * countRef.value = 43
 * console.log(countRef.value) // 43
 * ```
 */
export function toRef<T>(value: T): Ref<T>

/**
 * 对象属性双向绑定 - PropertyRef
 *
 * @overload
 * 当传入对象与键时，返回一个与该属性双向绑定的 Ref。
 * 如果属性不存在且传入 defaultValue，则在访问时使用默认值。
 * @template T - 对象类型
 * @template K - 键的类型
 * @param {T} object - 源对象
 * @param {K} key - 对象的键
 * @param {T[K]} [defaultValue] - 默认值（可选）
 * @returns {ToRef<T[K]>} 与对象属性绑定的 Ref 对象
 * @example
 * ```js
 * const state = reactive({ count: 0 })
 * const countRef = toRef(state, 'count')
 * console.log(countRef.value) // 0
 * countRef.value++
 * console.log(state.count) // 1
 *
 * // 使用默认值
 * const nameRef = toRef(state, 'name', 'default')
 * console.log(nameRef.value) // 'default'
 * ```
 */
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue?: T[K]
): PropertyRef<T, K>

/**
 * 创建一个基于源的 RefSignal
 *
 * 根据传入参数的不同，该函数有多种行为模式：
 * 1. 当传入函数时，返回一个只读 ReadonlyRef，其值通过 getter 访问源的返回值
 * 2. 当传入已有的 RefSignal 时，直接返回原 RefSignal
 * 3. 当传入任意普通值时，包装为可写的 Ref
 * 4. 当传入对象与键时，返回一个与该属性双向绑定的 PropertyRef
 *
 * @example
 * ```js
 * const getCount = () => 42
 * const countRef = toRef(getCount) // 等效于 readonlyRef(getCount)
 * console.log(countRef.value) // 42
 * ```
 */
export function toRef(arg1: any, arg2?: any, arg3?: any): any {
  // 对象属性重载：toRef(obj, key, defaultValue?)
  if (arguments.length >= 2) {
    const object = arg1
    const key = arg2
    const defaultValue = arg3

    const val = object[key]
    if (isRef(val)) return val

    return new PropertyRef(object, key, defaultValue)
  }

  const value = arg1

  // 如果传入的是 ref，则直接返回
  if (isRef(value)) return value

  // 如果传入函数，则生成只读 ref
  if (typeof value === 'function')
    return {
      get value() {
        return value()
      }
    }

  // 否则包装为普通 ref
  return new Ref(value, true)
}

/**
 * 响应式代理对象结构 - 保持响应式特性
 *
 * 该函数主要用于解构实现了 `ProxySignal` 接口的对象，同时保持响应式特性。
 * 如果传入的是普通对象，会给出警告但仍然创建代理，但不具备双向关联性。
 *
 * @template T - 对象类型
 * @param {T} object - reactive 对象
 * @param [skipWarn=false] - 跳过警告
 * @returns {{ [K in keyof T]: ToRef<T[K]> }} - 属性到 Ref 的映射
 * @example
 * ```js
 * const state = reactive({ count: 0, user: { name: 'Li' } })
 * const { count, user } = toRefs(state)
 * count.value++ // state.count === 1
 * state.user.name = 'Zhang' // user.value.name === 'Zhang'
 * ```
 */
export function toRefs<T extends object>(
  object: T,
  skipWarn = false
): { [K in keyof T]: ToRef<T[K]> } {
  if (!isPlainObject(object)) {
    throw new TypeError(`toRefs() called on a non-object`)
  }
  if (!skipWarn && !isReactive(object)) {
    console.warn(`toRefs() called on a non-reactive object`)
  }
  const ret: any = {}
  for (const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}
