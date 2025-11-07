import { isReactive } from '../reactive/index.js'
import type { RefSignal } from '../types/index.js'
import { isRefSignal, type SignalToRaw, toRaw } from '../utils/index.js'
import { PropertyRef } from './property.js'
import { ReadonlyRef } from './readonly.js'
import { Ref } from './ref.js'

/**
 * 导出一个类型别名 ToRef，它根据输入类型 T 决定返回的类型
 * @template T - 任意类型
 *
 * 如果 T 是 RefSignal 类型，则返回 T 本身；否则返回 Ref<T>
 */
export type ToRef<T> = T extends RefSignal ? T : Ref<T>
/**
 * 导出一个类型别名 UnwrapRef，用于解包 RefSignal 类型的值
 *
 * 如果 T 是 RefSignal 类型，则返回 SignalToRaw<T>，否则直接返回 T
 *
 * @template T - 泛型参数，表示需要解包的类型
 */
export type UnwrapRef<T> = T extends RefSignal ? SignalToRaw<T> : T
/**
 * 解除 `RefSignal` 对象的包装，返回其原始值
 *
 * 在响应式系统中，该函数用于获取RefSignal对象包装的原始值。如果传入的是普通值，则直接返回该值。
 * 这个函数在处理可能是实现了RefSignal接口的对象或普通值的参数时特别有用，可以统一处理两种情况。
 *
 * @template T - 值的类型
 * @param {T | Ref<T>} ref - 需要解包的值，可以是RefSignal对象或普通值
 * @returns {T} 如果输入是RefSignal对象，返回其 `toRaw` 原始值；如果是普通值，则原样返回
 * @example
 * ```js
 * // 处理Ref对象
 * const count = ref(0)
 * console.log(unref(count)) // 0 等效于 toRaw(count)
 * // 处理普通值
 * console.log(unref(100)) // 100
 * ```
 */
export function unref<T>(ref: T): UnwrapRef<T> {
  return isRefSignal(ref) ? toRaw(ref) : (ref as UnwrapRef<T>)
}
/**
 * 创建一个基于源的 RefSignal
 *
 * 根据传入参数的不同，该函数有多种行为模式：
 * 1. 当传入函数时，返回一个只读 ReadonlyRef，其值通过 getter 访问源的返回值
 * 2. 当传入已有的 RefSignal 时，直接返回原 RefSignal
 * 3. 当传入任意普通值时，包装为可写的 Ref
 * 4. 当传入对象与键时，返回一个与该属性双向绑定的 PropertyRef
 *
 * @overload
 * 当传入函数时，返回一个只读 Ref，Ref.value 通过 getter 访问源的返回值。
 * @template T - 值的类型
 * @param {() => T} source - 一个返回值的函数
 * @returns {ReadonlyRef<T>} ReadonlyRef 对象
 * @example
 * ```js
 * const getCount = () => 42
 * const countRef = toRef(getCount) // 等效于 readonlyRef(getCount)
 * console.log(countRef.value) // 42
 * ```
 */
export function toRef<T>(source: () => T): ReadonlyRef<T>

/**
 * 当传入已有的 RefSignal 时，直接返回原 RefSignal
 *
 * @template T
 * @param {T} source - 已有的 Ref 对象
 * @returns {T} 原 Ref 对象
 * @example
 * ```js
 * const count = ref(0)
 * const countRef = toRef(count)
 * console.log(countRef === count) // true
 * ```
 */
export function toRef<T extends RefSignal>(source: T): T

/**
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

export function toRef(arg1: any, arg2?: any, arg3?: any): any {
  // 对象属性重载：toRef(obj, key, defaultValue?)
  if (arguments.length >= 2) {
    const object = arg1
    const key = arg2
    const defaultValue = arg3

    const val = object[key]
    if (isRefSignal(val)) return val

    return new PropertyRef(object, key, defaultValue)
  }

  const value = arg1

  // 如果传入的是 ref，则直接返回
  if (isRefSignal(value)) return value

  // 如果传入函数，则生成只读 ref
  if (typeof value === 'function') return new ReadonlyRef(value)

  // 否则包装为普通 ref
  return new Ref(value)
}

/**
 * 将 reactive 对象的每个属性转换为 ref
 * 每个 ref 与原对象属性保持双向绑定
 *
 * 该函数主要用于解构 reactive 对象，同时保持响应式特性。
 * 如果传入的是普通对象而非 reactive 对象，会给出警告但仍然创建代理，但不具备响应式特性。
 *
 * @template T - 对象类型
 * @param {T} object - reactive 对象
 * @returns {{ [K in keyof T]: ToRef<T[K]> }} - 属性到 Ref 的映射
 * @example
 * ```js
 * const state = reactive({ count: 0, user: { name: 'Li' } })
 * const { count, user } = toRefs(state)
 * count.value++ // state.count === 1
 * state.user.name = 'Zhang' // user.value.name === 'Zhang'
 * ```
 */
export function toRefs<T extends object>(object: T): { [K in keyof T]: ToRef<T[K]> } {
  if (!isReactive(object)) {
    console.warn(`toRefs() called on a non-reactive object`)
  }
  const ret: any = {}
  for (const key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}
