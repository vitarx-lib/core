import { logger } from '@vitarx/utils'
import { REF_SIGNAL_SYMBOL, SIGNAL_SYMBOL } from '../constants.js'
import { isReactive } from '../reactive/index.js'
import type { RefSignal, SignalOptions } from '../types/index.js'
import { isRefSignal, type SignalToRaw } from '../utils/index.js'
import { Ref } from './ref.js'

export type ToRef<T> = T extends RefSignal ? T : Ref<T>

/**
 * 创建一个响应式引用信号
 *
 * 创建一个包装对象，使其成为响应式数据源。当引用的值发生变化时，
 * 所有依赖于该引用的计算和副作用将自动更新。默认情况下，对嵌套对象进行深度代理。
 *
 * @template Value - 信号值的类型
 * @returns {Ref<Value | undefined, true>} - 创建的响应式引用信号
 */
export function ref(): Ref<any>
/**
 * 创建一个响应式引用信号
 *
 * 创建一个包装对象，使其成为响应式数据源。当引用的值发生变化时，
 * 所有依赖于该引用的计算和副作用将自动更新。默认情况下，对嵌套对象进行深度代理。
 *
 * @template Value - 信号值的类型
 * @returns {Ref<Value | undefined, true>} - 创建的响应式引用信号
 */
export function ref<Value>(): Ref<Value | undefined>
/**
 * 创建一个响应式引用对象，用于在响应式系统中包装原始值或引用
 *
 * @template Value - 引用中存储的值的类型
 * @template Deep - 是否深度转换对象的布尔值，默认为true
 * @param value - 要包装的初始值，可以是普通值或已有的引用
 * @param {object | boolean} [options] - 信号的选项配置，支持直接传入boolean指定deep配置
 * @param {boolean} [options.deep=true] - 是否深度代理嵌套对象，为true时会递归代理所有嵌套属性
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新，默认使用Object.is进行比较
 * @returns - 返回一个响应式引用对象，该对象会跟踪其值的变化
 */
export function ref<Value, Deep extends boolean = true>(
  value: Value | Ref<Value, Deep>, // 要包装的值，可以是原始值或已有的引用
  options?: SignalOptions<Deep> | Deep // 可选配置，可以是SignalOptions对象或布尔值
): Ref<Value, Deep> // 返回一个响应式引用对象
/**
 * 创建一个响应式引用信号
 *
 * 创建一个包装对象，使其成为响应式数据源。当引用的值发生变化时，
 * 所有依赖于该引用的计算和副作用将自动更新。默认情况下，对嵌套对象进行深度代理。
 *
 * @template Value - 信号值的类型
 * @template Deep - 是否使用深度信号，默认为true
 * @param {Value} [value=undefined] - 信号初始值
 * @param {object | boolean} [options] - 信号的选项配置，支持直接传入boolean指定deep配置
 * @param {boolean} [options.deep=true] - 是否深度代理嵌套对象，为true时会递归代理所有嵌套属性
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新，默认使用Object.is进行比较
 * @returns {Ref<Value, Deep>} - 创建的响应式引用信号
 * @example
 * // 创建一个基本类型的ref
 * const count = ref(0)
 * console.log(count.value) // 0
 * count.value++
 * console.log(count.value) // 1
 *
 * // 创建一个对象ref并使用自定义比较函数
 * const user = ref({ name: 'Zhang', age: 25 }, {
 *   compare: (prev, next) => prev.name === next.name
 * })
 *
 * // 创建一个一个浅层ref
 * const shallow = ref({ a:{b:1} }, false)
 *
 * // 创建一个嵌套对象ref
 * const userInfo = ref({ name: 'Zhang', profile: { age: 25 } })
 *
 * // 嵌套ref
 * const count2 = ref(ref(1))
 * count2.value++
 * console.log(count2.value) // 2
 */
export function ref<Value = any, Deep extends boolean = true>(
  value?: Value | Ref<Value, Deep>,
  options?: SignalOptions<Deep> | Deep
): Ref<Value, Deep> {
  if (isRef(value)) return value as Ref<Value, Deep>
  if (typeof options === 'boolean') {
    return new Ref(value, { deep: options }) as Ref<Value, Deep>
  }
  return new Ref(value, options) as Ref<Value, Deep>
}

/**
 * 创建一个浅层响应式引用对象
 *
 * @returns 返回一个浅层响应式引用对象，初始值为 undefined
 */
export function shallowRef(): Ref<any, false>
/**
 * 创建一个浅层响应式引用对象
 *
 * @template Value - 引用值类型
 * @returns 返回一个浅层响应式引用对象，初始值为 undefined
 */
export function shallowRef<Value>(): Ref<Value | undefined, false>
/**
 * 创建一个浅层响应式引用对象
 * @param value - 初始值
 * @param {object} [options] - 可选配置项
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新
 * @returns - 返回一个浅层响应式引用对象
 */
export function shallowRef<Value>(
  value: Value | Ref<Value, false>, // 初始值，可以是普通值或非深层的响应式引用
  options?: Omit<SignalOptions, 'deep'> // 可选配置，排除了 'deep' 选项
): Ref<Value, false> // 返回一个浅层响应式引用对象
/**
 * 创建一个浅响应式引用信号
 *
 * @template Value - 信号值的类型
 * @param {Value} [value=undefined] - 信号初始值
 * @param {object} [options] - 信号的选项，包括是否使用深度信号和比较函数
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新
 * @returns {Ref<Value, false>} - 浅响应式引用信号对象
 * @example
 * // 创建一个基本的浅响应式引用
 * const count = shallowRef(0)
 * console.log(count.value) // 0
 * count.value++
 * console.log(count.value) // 1
 *
 * // 展示嵌套对象的响应式行为差异
 * const user = shallowRef({ name: 'Zhang', profile: { age: 25 } })
 *
 * // 修改顶层属性会触发更新
 * user.value.name = 'Li' // 会触发更新
 *
 * // 修改嵌套对象的属性不会触发更新
 * user.value.profile.age = 26 // 不会触发更新，因为profile对象没有被代理
 * // 更新嵌套对象且触发更新
 * user.forceUpdate() // 1. ✅ 修改完成过后直接调用forceUpdate方法
 * user.value = { ...user.value, profile: { ...user.value.profile, age: 26 } } // 2. ❌ 虽然会触发，但是不推荐
 *
 * // 使用自定义比较函数的场景
 * const list = shallowRef([1, 2, 3], {
 *   compare: (prev, next) => prev.length === next.length
 * })
 */
export function shallowRef<Value = any>(
  value?: Value | Ref<Value, false>,
  options?: Omit<SignalOptions, 'deep'>
): Ref<Value, false> {
  if (isRef(value)) return value as Ref<Value, false>
  return new Ref(value, { ...options, deep: false }) as Ref<Value, false>
}

/**
 * 判断是否为 Ref 对象
 *
 * 注意和 `isRefSignal` 的区别，`isRef` 只判断是否为 `Ref` 对象，而 `isRefSignal` 是判断对象是否具有响应式的 value 属性
 *
 * @param {any} val - 任意值
 * @return {boolean} 是否为 Ref 对象
 * @example
 * // 创建一个 Ref 对象
 * const count = ref(0)
 *
 * // isRef 只检查对象是否为 Ref 实例
 * console.log(isRef(count)) // true
 * console.log(isRef(0)) // false
 * console.log(isRefSignal(count)) // true ，因为 Ref 实例也是一个 RefSignal 的实现
 *
 * // 对于自定义的Ref对象，两者的表现不同
 * class CustomRef {
 *   [SIGNAL_SYMBOL]:true
 *   [REF_SIGNAL_SYMBOL]:true
 *   // 省略了构造函数等相关代码，只是为了演示
 *   get value() {//...}
 *   set value(newValue) {//...}
 * }
 * const customRef = new CustomRef(0)
 * console.log(isRef(customRef)) // false，因为不是 Ref 实例
 * console.log(isRefSignal(customRef)) // true，因为 CustomRef 符合RefSignal的特征
 */
export function isRef(val: any): val is Ref {
  return val instanceof Ref
}

/**
 * 解除Ref对象的包装，返回其原始值
 *
 * 在响应式系统中，该函数用于获取Ref对象包装的原始值。如果传入的是普通值，则直接返回该值。
 * 这个函数在处理可能是Ref对象或普通值的参数时特别有用，可以统一处理两种情况。
 *
 * @template T - 值的类型
 * @param {T | Ref<T>} ref - 需要解包的值，可以是Ref对象或普通值
 * @returns {T} 如果输入是Ref对象，返回其.value值；如果是普通值，则原样返回
 * @example
 * // 处理Ref对象
 * const count = ref(0)
 * console.log(unref(count)) // 0 等效于 toRaw(count)
 * // 处理普通值
 * console.log(unref(100)) // 100
 */
export function unref<T>(ref: T): SignalToRaw<T> {
  return isRefSignal(ref) ? ref.value : (ref as SignalToRaw<T>)
}

/**
 * 创建一个基于源的 Ref
 *
 * 根据传入参数的不同，该函数有多种行为模式：
 * 1. 当传入函数时，返回一个只读 Ref，其值通过 getter 访问源的返回值
 * 2. 当传入已有的 Ref 时，直接返回原 Ref
 * 3. 当传入任意普通值时，包装为可写的 Ref
 * 4. 当传入对象与键时，返回一个与该属性双向绑定的 Ref
 *
 * @overload
 * 当传入函数时，返回一个只读 Ref，Ref.value 通过 getter 访问源的返回值。
 * @template T - 值的类型
 * @param {() => T} source - 一个返回值的函数
 * @returns {Readonly<Ref<T>>} 只读的 Ref 对象
 * @example
 * const getCount = () => 42
 * const countRef = toRef(getCount)
 * console.log(countRef.value) // 42
 */

export function toRef<T>(source: () => T): Readonly<Ref<T>>

/**
 * 当传入已有的 Ref 时，直接返回原 Ref
 *
 * @template T
 * @param {T} source - 已有的 Ref 对象
 * @returns {T} 原 Ref 对象
 * @example
 * const count = ref(0)
 * const countRef = toRef(count)
 * console.log(countRef === count) // true
 */
export function toRef<T extends RefSignal>(source: T): T

/**
 * 当传入任意普通值时，包装为可写的 Ref
 * @template T - 值的类型
 * @param {T} value - 普通值
 * @returns {Ref<T>} 包装后的 Ref 对象
 * @example
 * const countRef = toRef(42)
 * console.log(countRef.value) // 42
 * countRef.value = 43
 * console.log(countRef.value) // 43
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
 * const state = reactive({ count: 0 })
 * const countRef = toRef(state, 'count')
 * console.log(countRef.value) // 0
 * countRef.value++
 * console.log(state.count) // 1
 *
 * // 使用默认值
 * const nameRef = toRef(state, 'name', 'default')
 * console.log(nameRef.value) // 'default'
 */
export function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue?: T[K]
): ToRef<T[K]>

export function toRef(arg1: any, arg2?: any, arg3?: any): any {
  // 对象属性重载：toRef(obj, key, defaultValue?)
  if (arguments.length >= 2) {
    const object = arg1
    const key = arg2
    const defaultValue = arg3

    const val = object[key]
    if (isRef(val)) return val

    class PropertyRef implements RefSignal {
      readonly [REF_SIGNAL_SYMBOL] = true
      readonly [SIGNAL_SYMBOL] = true
      constructor(
        private readonly target: any,
        private readonly key: any,
        private readonly defaultValue: any
      ) {}
      get value() {
        const v = this.target[this.key]
        return v === undefined ? this.defaultValue : v
      }
      set value(newVal) {
        this.target[this.key] = newVal
      }
    }

    return new PropertyRef(object, key, defaultValue)
  }

  const value = arg1

  // 如果传入的是 ref，则直接返回
  if (isRef(value)) return value

  // 如果传入函数，则生成只读 ref
  if (typeof value === 'function') {
    class GetterRef implements RefSignal {
      readonly [REF_SIGNAL_SYMBOL] = true
      readonly [SIGNAL_SYMBOL] = true
      constructor(private readonly getter: () => any) {}
      get value() {
        return this.getter()
      }
    }
    return new GetterRef(value)
  }

  // 否则包装为普通 ref
  return ref(value)
}

/**
 * 将 reactive 对象的每个属性转换为 ref
 * 每个 ref 与原对象属性保持双向绑定
 *
 * 该函数主要用于解构 reactive 对象，同时保持响应式特性。
 * 如果传入的是普通对象而非 reactive 对象，会给出警告并仍然创建 ref。
 *
 * @template T - 对象类型
 * @param {T} object - reactive 对象
 * @returns {{ [K in keyof T]: ToRef<T[K]> }} - 属性到 Ref 的映射
 * @example
 * const state = reactive({ count: 0, user: { name: 'Li' } })
 * const { count, user } = toRefs(state)
 * count.value++ // state.count === 1
 * state.user.name = 'Zhang' // user.value.name === 'Zhang'
 *
 * // 对于普通对象
 * const plain = { count: 0 }
 * const { count: countRef } = toRefs(plain)
 * // 会给出警告，但仍然创建 ref
 */
export function toRefs<T extends object>(object: T): { [K in keyof T]: ToRef<T[K]> } {
  if (!isReactive(object)) {
    logger.warn(`toRefs() expects a reactive object but received a plain one.`)
    const result: any = {}
    for (const key in object) {
      const val = (object as any)[key]
      result[key] = isRef(val) ? val : ref(val)
    }
    return result
  }
  const ret: any = {}
  for (const key in object) {
    const val = (object as any)[key]
    ret[key] = isRef(val) ? val : toRef(object, key)
  }
  return ret
}
