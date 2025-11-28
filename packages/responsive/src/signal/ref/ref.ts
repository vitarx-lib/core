import { AnyObject, isObject } from '@vitarx/utils'
import { Depend } from '../../depend/index.js'
import {
  DEEP_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL
} from '../constants.js'
import { SignalManager } from '../manager.js'
import { reactive } from '../reactive/index.js'
import type {
  BaseSignal,
  NonSignal,
  ProxySignal,
  RefSignal,
  SignalOptions
} from '../types/index.js'
import { isMarkNonSignal, isRefSignal, isSignal } from '../utils/index.js'

/**
 * 解包嵌套的响应式信号值
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于递归解包对象中所有的响应式信号值。如果属性值是 `RefSignal` 类型，
 * 则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```ts
 * type User = {
 *   name: RefSignal<string>
 *   age: number
 * }
 *
 * type UnwrappedUser = UnwrapNestedRefs<User>
 * // 等价于 { name: string; age: number }
 * ```
 */
export type UnwrapNestedRefs<T extends AnyObject> = {
  [K in keyof T]: T[K] extends NonSignal ? T[K] : T[K] extends RefSignal<infer U> ? U : T[K]
}

/**
 * 响应式引用信号的值类型
 */
export type RefValue<T, Deep extends boolean = true> = Deep extends false
  ? T
  : T extends AnyObject
    ? T extends NonSignal
      ? T
      : T extends BaseSignal
        ? T
        : ProxySignal<T, UnwrapNestedRefs<T>, Deep>
    : T

/**
 * `Ref` 值引用对象，用于引用一个值，使其成为响应式变量。
 *
 * @template T - 值类型
 * @template Deep - 是否深度代理
 * @remarks
 * 该对象的`value`属性是响应式的，当其值发生变化时，会触发监听器的回调函数。
 *
 * @example
 * ```ts
 * const count = new Ref(0) // 或使用助手函数 ref(0)
 * count.value++ // count.value 的值变为1
 * ```
 */
export class Ref<T = any, Deep extends boolean = true> implements RefSignal<RefValue<T, Deep>, T> {
  /**
   * 标识为响应式信号对象
   * @readonly
   */
  readonly [SIGNAL_SYMBOL] = true

  /**
   * 标识为值引用类型的响应式信号
   * @readonly
   */
  readonly [REF_SIGNAL_SYMBOL] = true

  /**
   * 响应式配置选项
   * @private
   */
  private readonly _options: Required<SignalOptions<Deep>>

  /**
   * 标识当前值是否需要被代理为响应式对象
   * @private
   */
  private _shouldProxyValue: boolean = false

  /**
   * 存储被代理后的子响应式对象
   * @private
   */
  private _reactiveValue?: RefValue<T, Deep>

  /**
   * 创建Ref值信号对象
   *
   * @param {T} value - 需要被包装为响应式的值
   * @param {SignalOptions} [options] - 响应式配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理嵌套对象
   * @param {CompareFunction} [options.compare=Object.is] - 值比较函数，用于决定是否触发更新
   */
  constructor(value: T, options?: SignalOptions<Deep>) {
    if (isRefSignal(value)) throw new Error('Cannot set value of Ref to Ref')
    this._options = {
      compare: options?.compare ?? Object.is,
      deep: options?.deep ?? (true as Deep)
    }
    this._value = value
    this.evaluateProxyNeeded()
  }

  /**
   * 存储原始值的内部属性
   *
   * @private
   */
  private _value: T

  /**
   * 获取响应式值
   *
   * 根据配置和值类型，可能返回原始值或响应式代理对象：
   * - 如果已存在响应式代理对象，则直接返回
   * - 如果需要代理且尚未创建代理，则创建新的响应式代理
   * - 否则返回原始值并追踪依赖
   *
   * @returns {RefValue<T, Deep>} 响应式值或原始值
   */
  get value(): RefValue<T, Deep> {
    if (this._reactiveValue) {
      return this._reactiveValue
    } else if (this._shouldProxyValue) {
      this._reactiveValue = reactive(this._value as AnyObject, this._options) as RefValue<T, Deep>
      SignalManager.bindParent(this._reactiveValue as BaseSignal, this, 'value')
      this._shouldProxyValue = false
      return this._reactiveValue
    }
    Depend.track(this, 'value')
    return this._value as RefValue<T, Deep>
  }

  /**
   * 获取原始值目标值
   *
   * @private
   * @returns {T} 原始值
   */
  get [SIGNAL_RAW_VALUE_SYMBOL](): T {
    return this._value
  }

  /**
   * 设置新值并触发更新
   *
   * 当新值与旧值不同时：
   * - 清理旧的响应式代理（如果存在）
   * - 更新内部值
   * - 重新评估是否需要代理
   * - 通知观察者和父级信号
   *
   * @param {T} newValue - 要设置的新值
   * @throws {Error} 如果尝试设置值为Ref对象，则抛出异常
   */
  set value(newValue: T) {
    if (isRefSignal(newValue)) throw new Error('Cannot set value of Ref to Ref')
    if (this._options.compare(this._value, newValue)) return
    // 清理旧的响应式代理
    if (this._reactiveValue) {
      SignalManager.unbindParent(this._reactiveValue as unknown as BaseSignal, this, 'value')
      this._reactiveValue = undefined
    }
    this._value = newValue
    this.evaluateProxyNeeded()
    SignalManager.notifySubscribers(this, 'value')
  }

  /**
   * 是否深度代理标识
   *
   * @returns {Deep} 当前实例的深度代理配置
   */
  get [DEEP_SIGNAL_SYMBOL](): Deep {
    return this._options.deep
  }

  /**
   * 定义当对象需要转换成原始值时的行为
   *
   * 根据不同的转换提示返回适当的值：
   * - 'number': 返回值本身，尝试进行数值转换
   * - 'string': 调用toString方法
   * - 'default': 返回值本身
   *
   * @param {string} hint - 转换提示类型
   * @returns {any} 根据提示类型转换后的原始值
   */
  [Symbol.toPrimitive](hint: string): any {
    switch (hint) {
      case 'string':
        return this.toString()
      case 'default':
        return this.value
    }
  }

  /**
   * 将引用的目标值转换为字符串
   *
   * 如果目标值有`toString`方法，则会返回目标值的字符串形式，
   * 否则返回格式化的类型描述。
   *
   * @returns {string} 字符串表示
   * @override
   */
  toString(): string {
    Depend.track(this, 'value')
    if (this._value?.toString) {
      return this._value.toString()
    } else {
      return `[Object Ref<${typeof this._value}>]`
    }
  }

  /**
   * 重新评估当前值是否需要代理
   *
   * 根据以下条件决定是否需要将value转换为响应式对象：
   * - deep配置为true（启用深度响应）
   * - 当前值是对象类型
   * - 当前值未被标记为非响应式对象
   *
   * @private
   */
  private evaluateProxyNeeded() {
    this._shouldProxyValue =
      this._options.deep &&
      isObject(this._value) &&
      !isMarkNonSignal(this._value) &&
      !isSignal(!this._value)
  }

  /**
   * 手动触发value值的更新事件
   *
   * 即使值没有发生变化，也会强制触发更新通知。
   * 这在一些特殊场景下很有用，比如更新了浅引用对象的深层属性，希望触发监听器。
   */
  public forceUpdate(): void {
    SignalManager.notifySubscribers(this, 'value')
  }
}

/**
 * 判断是否为 Ref 对象
 *
 * 注意 `isRef` 和 `isRefSignal` 的区别，`isRef` 只判断是否为 `Ref` 对象，
 * 而 `isRefSignal` 是判断对象是实现了 `RefSignal` 接口
 *
 * @param {any} val - 任意值
 * @return {boolean} 是否为 Ref 对象
 * @example
 * ```ts
 * // 创建一个 Ref 对象
 * const count = ref(0)
 *
 * // isRef 只检查对象是否为 Ref 实例
 * console.log(isRef(count)) // true
 * console.log(isRef(0)) // false
 * console.log(isRefSignal(count)) // true ，因为 Ref 实例也实现了 RefSignal 接口
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
 * ```
 */
export function isRef(val: any): val is Ref {
  return !!(val && val instanceof Ref)
}

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
 * ```ts
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
 * ```
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
 * ```ts
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
 * ```
 */
export function shallowRef<Value = any>(
  value?: Value | Ref<Value, false>,
  options?: Omit<SignalOptions, 'deep'>
): Ref<Value, false> {
  if (isRef(value)) return value as Ref<Value, false>
  return new Ref(value, { ...options, deep: false }) as Ref<Value, false>
}
