import { isMakeProxy, isProxy, ValueProxy } from './helper.js'
import { createReactive } from './reactive.js'
import { Observers } from '../observer/index.js'
import { PROXY_DEEP_SYMBOL, PROXY_SYMBOL, VALUE_PROXY_SYMBOL } from './constants.js'
import { Depend } from './depend.js'

/**
 * # `Ref`值代理对象，用于代理一个值，使其成为响应式变量。
 *
 * @template T - 任意类型
 * @remarks
 * 该对象的`value`属性是响应式的，当其值发生变化时，会触发`watch`监听器的回调函数。
 *
 * 该对象的`value`属性可以是任意类型，但需注意的是，当目标值是一个响应式对象时，且深度代理为true时，这会抛出一个警告，并且不会监控其变化。
 *
 * @example
 * ```ts
 * const count = new Ref(0) // 或使用助手函数 ref(0)
 * count.value++ // count 的值变为1
 * ```
 */
export class Ref<T = any> implements ValueProxy<T> {
  // 标识为代理对象
  readonly [PROXY_SYMBOL] = true
  // 标识为值代理对象
  readonly [VALUE_PROXY_SYMBOL] = true
  /** 是否深度代理 */
  readonly #deep: boolean
  /** 目标变量 */
  #value: T

  /**
   * 构造函数
   *
   * @param target - 任意值
   * @param deep - 是否深度代理，默认为true
   */
  constructor(target: T, deep: boolean = true) {
    this.#value = target
    this.#deep = deep
    this.#detectProxy(target)
  }

  /** 获取目标变量 */
  get value(): T {
    // 惰性代理子对象
    if (this.#deep && isMakeProxy(this.#value)) {
      this.#value = createReactive(this.#value, {
        deep: this.#deep,
        trigger: this.trigger.bind(this)
      })
    } else if (!isProxy(this.#value)) {
      Depend.track(this, 'value')
    }
    // 返回目标变量
    return this.#value
  }

  /** 修改目标变量 */
  set value(newValue: T) {
    if (newValue !== this.#value) {
      this.#detectProxy(newValue)
      this.#value = newValue
      this.trigger()
    }
  }

  // 深度代理标识
  get [PROXY_DEEP_SYMBOL](): boolean {
    return this.#deep
  }

  // 定义当对象需要转换成原始值时的行为
  [Symbol.toPrimitive](hint: any) {
    switch (hint) {
      case 'number':
        return this.value
      case 'string':
        return this.toString()
      case 'default':
        return this.value
    }
  }

  /**
   * 手动触发更新事件
   *
   * @private
   */
  trigger() {
    Observers.trigger(this, 'value' as any)
  }

  /**
   * 将引用的目标值转换为字符串
   *
   * 如果目标值有`toString`方法，则会返回目标值的字符串形式，否则返回[Object Ref<`typeof target`>]。
   *
   * @override
   */
  toString() {
    if (this.#value?.toString) {
      return this.#value.toString()
    } else {
      return `[Object Ref<${typeof this.#value}>]`
    }
  }

  /** 检测代理 */
  #detectProxy(value: any) {
    if (this.#deep && isProxy(value)) {
      console.warn(
        `[Vitarx.Ref][WARN]：当deep属性为true时，Ref对象的引用值不应该是代理对象（Ref|Reactive）。`
      )
    }
  }
}

/**
 * 判断是否为 Ref 对象
 *
 * @param {any} val - 任意值
 * @return {boolean} 是否为 Ref 对象
 */
export function isRef(val: any): val is Ref {
  return val instanceof Ref
}

/**
 * 解除Ref对象，返回其value属性值
 *
 * `isRef(ref) ? ref.value : ref`的语法糖，它不具备任何其他效果。
 *
 * @template T - ref值类型
 * @param {any} ref - 任意值
 * @return {T} 如果传入的是`Ref`对象则返回其value属性值，否则原样返回
 */
export function unRef<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

/**
 * 创建 {@link Ref} 值代理对象
 *
 * 用法:
 * 1. `ref(value)`：传入值时，返回 `Ref<值的类型>`。
 * 2. `ref()`：不传值时，返回 `Ref<any>`，初始值为 `undefined`。
 * 3. `ref<T>()`：显式指定泛型时，不传值返回 `Ref<T | undefined>`。
 *
 * @template T - 值类型
 * @param {T} [value] - 代理的值
 * @param {boolean} [deep=true] - 是否深度代理，仅值为对象时有效。
 * @return {Ref<T>} Ref对象
 */
export function ref<T>(value: T, deep?: boolean): Ref<T>

/**
 * 创建 {@link Ref} 值代理对象
 *
 * 未传值时，返回 `Ref<any>`，初始值为 `undefined`。
 *
 * @return {Ref<any>}
 */
export function ref(value?: undefined, deep?: boolean): Ref

/**
 * 创建 {@link Ref} 值代理对象
 *
 * 显式指定泛型时，不传值返回 `Ref<T | undefined>`。
 *
 * @template T - 值类型
 * @return {Ref<T | undefined>}
 */
export function ref<T>(value?: undefined, deep?: boolean): Ref<T | undefined>
/**
 * 创建 {@link Ref} 值代理对象
 *
 * @template T - 值类型
 * @param {T} [value] - 代理的值
 * @param {boolean} [deep=true] - 是否深度代理，仅值为对象时有效。
 * @return {Ref<T>} Ref对象
 */
export function ref<T>(value?: T, deep: boolean = true): Ref<T | undefined> {
  return new Ref(value, deep)
}

/**
 * 创建 {@link Ref} 值代理对象(浅代理)
 *
 * 用法:
 * 1. `shallowRef(value)`：传入值时，返回 `Ref<值的类型>`。
 * 2. `shallowRef()`：不传值时，返回 `Ref<any>`，初始值为 `undefined`。
 * 3. `shallowRef<T>()`：显式指定泛型时，不传值返回 `Ref<T | undefined>`。
 *
 * @template T - 值类型
 * @param {T} [value] - 代理的值
 * @return {Ref<T>} Ref对象
 */
export function shallowRef<T>(value: T): Ref<T>
/**
 * 创建 {@link Ref} 值代理对象(浅代理)
 *
 * 未传值时，返回 `Ref<any>`，初始值为 `undefined`。
 *
 * @return {Ref<any>}
 */
export function shallowRef(value?: undefined): Ref
/**
 * 创建 {@link Ref} 值代理对象(浅代理)
 *
 * 显式指定泛型时，不传值返回 `Ref<T | undefined>`。
 *
 * @template T - 值类型
 * @return {Ref<T | undefined>}
 */
export function shallowRef<T>(value?: undefined): Ref<T | undefined>
/**
 * 创建 {@link Ref} 值代理对象(浅代理)
 *
 * @template T - 值类型
 * @param {T} [value] - 代理的值
 * @return {Ref<T | undefined>}
 */
export function shallowRef<T>(value?: T): Ref<T | undefined> {
  return new Ref(value, false)
}
