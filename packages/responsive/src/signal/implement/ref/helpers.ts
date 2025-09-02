import { type SignalOptions, type SignalToRaw, toRaw } from '../../core/index.js'
import { Ref } from './ref.js'

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
  return toRaw(ref)
}
