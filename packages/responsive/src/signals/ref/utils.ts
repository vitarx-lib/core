import { isFunction, isPlainObject } from '@vitarx/utils'
import { isReactive, isRef, type Ref } from '../shared/index.js'
import { GetterRef } from './getter.js'
import { PropertyRef } from './property.js'
import { ValueRef } from './value.js'

const propertyRefStore = new WeakMap<object, Map<PropertyKey, Ref>>()

/**
 * ToRef 类型工具，它根据输入类型 T 转换类型
 *
 * 如果 T 已经是 Ref，则返回 T 本身；否则返回 Ref<T>。
 *
 * @template T - 任意类型
 *
 * @example
 * ```typescript
 * type A = ToRef<number> // Ref<number>
 * type B = ToRef<Ref<any>> // Ref<any>
 * ```
 */
export type ToRef<T> = T extends Ref ? T : Ref<T>

/**
 * 转换为 GetterRef
 *
 * @overload
 * 当传入函数时，返回一个只读 GetterRef，.value 访问 getter 返回值。
 * @template T - 值的类型
 * @param {() => T} source - 一个返回值的函数
 * @returns {GetterRef<T>} GetterRef 对象
 * @example
 * ```js
 * const data = reactive({ count: 0 })
 * const countRef = toRef(() => data.count)
 * console.log(countRef.value) // 0
 * ```
 */
export function toRef<T>(source: () => T): GetterRef<T>
/**
 * 无意义的任何转换
 *
 * @overload
 * 传入符合 RefWrap 接口的对象原样返回
 *
 * @template T - 值的类型
 * @param {T} value - 普通值
 * @returns {ValueRef<T>} 包装后的 Ref 对象
 * @example
 * ```js
 * const count = ref(42)
 * const countRef = toRef(count)
 * console.log(count === countRef) // true
 * ```
 */
export function toRef<T extends Ref<any, any>>(value: T): T
/**
 * 常规转换为 Ref
 *
 * @overload
 * 当传入任意普通值时，包装为可写的 Ref
 * @template T - 值的类型
 * @param {T} value - 普通值
 * @returns {ValueRef<T>} 包装后的 Ref 对象
 * @example
 * ```js
 * const countRef = toRef(42)
 * console.log(countRef.value) // 42
 * countRef.value = 43
 * console.log(countRef.value) // 43
 * ```
 */
export function toRef<T>(value: T): ValueRef<T>
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
 * 1. 当传入函数时，返回一个 GetterRef，其值通过 getter 访问源的返回值
 * 2. 当传入已有的 RefWrap 时，直接返回原 RefWrap
 * 3. 当传入任意普通值时，包装为可写的 Ref
 * 4. 当传入对象与键时，返回一个与该属性双向绑定的 PropertyRef
 *
 * @example
 * ```js
 * // 创建一个 GetterRef
 * const getCount = () => 42
 * const countRef = toRef(getCount) // 等效于 readonlyRef(getCount)
 * console.log(countRef.value) // 42
 *
 * // 创建一个可写的 Ref
 * const count = toRef(0)
 *
 * // 创建一个 PropertyRef
 * const state = reactive({ count: 0 })
 * const countRef = toRef(state, 'count')
 * console.log(countRef.value) // 0
 * countRef.value++
 * console.log(state.count) // 1
 * console.log(countRef.value) // 1
 * ```
 */
export function toRef(arg1: any, arg2?: any, arg3?: any): Ref {
  // 对象属性重载：toRef(obj, key, defaultValue?)
  if (arguments.length >= 2) {
    const object = arg1
    const key = arg2
    const defaultValue = arg3

    const val = object[key]
    if (isRef(val)) return val
    const cached = propertyRefStore.get(object)?.get(key)
    if (cached) return cached
    
    const p = new PropertyRef(object, key, defaultValue)
    
    // 确保对象在WeakMap中有对应的Map
    if (!propertyRefStore.has(object)) {
      propertyRefStore.set(object, new Map())
    }
    
    // 设置缓存
    propertyRefStore.get(object)!.set(key, p)
    return p
  }

  const value = arg1

  // 如果传入的是 ref，则直接返回
  if (isRef(value)) return value

  // 如果传入函数，则生成只读 ref
  if (typeof value === 'function') {
    return new GetterRef(value)
  }

  // 否则包装为普通 ref
  return new ValueRef(value)
}

/**
 * 响应式代理对象结构 - 保持响应式特性
 *
 * 该函数主要用于解构实现了 `Reactive` 接口的对象，同时保持响应式特性。
 * 如果传入的是普通对象，会给出警告但仍然创建代理，但不具备双向关联性。
 *
 * @template T - 对象类型
 * @param {T} obj - 键值对对象
 * @param [skipWarn=false] - 跳过非响应式对象警告
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
  obj: T,
  skipWarn = false
): { [K in keyof T]: ToRef<T[K]> } {
  if (!isPlainObject(obj)) {
    throw new TypeError(`toRefs() called on a non-object`)
  }
  if (!skipWarn && !isReactive(obj)) {
    console.warn(`toRefs() called on a non-reactive object`)
  }
  const ret: any = {}
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }
  return ret
}

/**
 * 将传入的源转换为普通值
 *
 * @template T - 值类型
 * @param source 可以是普通值、响应式引用或返回值的函数
 * @returns {T} 返回转换后的普通值
 */
export function toValue<T>(source: T | Ref<T, any> | (() => T)): T {
  return isRef(source) ? source.value : isFunction(source) ? source() : source
}
