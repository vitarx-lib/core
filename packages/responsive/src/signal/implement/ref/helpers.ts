import type { SignalOptions } from '../../core/index'
import { Ref } from './ref'

/**
 * 创建一个响应式引用信号
 *
 * 创建一个包装对象，使其成为响应式数据源。当引用的值发生变化时，
 * 所有依赖于该引用的计算和副作用将自动更新。默认情况下，对嵌套对象进行深度代理。
 *
 * @template Value - 信号值的类型
 * @template Deep - 是否使用深度信号，默认为true
 * @param {Value} value - 信号初始值
 * @param {object} [options] - 信号的选项配置
 * @param {boolean} [options.deep=true] - 是否深度代理嵌套对象，为true时会递归代理所有嵌套属性
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新，默认使用Object.is进行比较
 * @returns {Ref<Value, Deep>} - 创建的响应式引用信号
 * @example
 * // 创建一个简单的ref
 * const count = ref(0)
 * console.log(count.value) // 0
 * count.value++
 * console.log(count.value) // 1
 *
 * // 创建一个对象ref并使用自定义比较函数
 * const user = ref({ name: 'Zhang', age: 25 }, {
 *   compare: (prev, next) => prev.name === next.name
 * })
 */
export function ref<Value, Deep extends boolean = true>(
  value: Value,
  options?: SignalOptions<Deep>
): Ref<Value, Deep> {
  return new Ref(value, options)
}

/**
 * 创建一个浅响应式引用信号
 *
 * @template Value - 信号值的类型
 * @param {Value} value - 信号初始值
 * @param {object} [options] - 信号的选项，包括是否使用深度信号和比较函数
 * @param {function} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新
 * @returns {Ref<Value, false>} - 创建的浅响应式引用信号
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
export function shallowRef<Value>(value: Value, options?: SignalOptions<false>): Ref<Value, false> {
  return new Ref(value, { ...options, deep: false })
}

/**
 * 判断是否为 Ref 对象
 *
 * 注意和 `isRefSignal` 的区别，`isRef` 只判断是否为 `Ref` 对象，而 `isRefSignal` 会判断对象是否具有响应式的 value 属性
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
