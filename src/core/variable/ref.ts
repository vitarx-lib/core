import { isObject } from '../../utils'
import { isProxy, ValueProxy } from './helper.js'
import { createReactive } from './reactive.js'
import { Observers } from '../observer'
import { PROXY_DEEP_SYMBOL, PROXY_SYMBOL, VALUE_PROXY_SYMBOL } from './constants.js'
import { track } from './depend.js'

/** 解除响应式对象 */
export type UnRef<T> = T extends Ref<infer U> ? U : T

/**
 * # `Ref`对象，用于引用一个值，并可以监听其变化
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
  /** 目标变量 */
  #target: T
  /** 是否深度代理 */
  readonly #deep: boolean

  /**
   * 构造函数
   *
   * @param target - 任意值
   * @param deep - 是否深度代理，默认为true
   */
  constructor(target: T, deep: boolean = true) {
    this.#target = target
    this.#deep = deep
    this.#detectProxy(target)
  }

  /** 获取目标变量 */
  get value(): T {
    // 惰性代理子对象
    if (this.#deep && isObject(this.#target) && !isProxy(this.#target)) {
      this.#target = createReactive(this.#target, this.#deep, this.trigger.bind(this))
    } else if (!isProxy(this.#target)) {
      track(this, 'value')
    }
    // 返回目标变量
    return this.#target
  }

  /** 修改目标变量 */
  set value(newValue: T) {
    if (newValue !== this.#target) {
      this.#detectProxy(newValue)
      this.#target = newValue
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
   * 触发更新事件
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
    if (this.#target?.toString) {
      return this.#target.toString()
    } else {
      return `[Object Ref<${typeof this.#target}>]`
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
 * @param val
 */
export function isRef(val: any): val is Ref {
  return val instanceof Ref
}

/**
 * 解除Ref对象，返回其value属性值
 *
 * @template T - 任意类型
 * @param ref - 任意值或`Ref`对象
 * @return {T} 如果传入的是`Ref`对象则返回其value属性值，否则返回原值
 */
export function unRef<T>(ref: T | Ref<T>): T {
  return isRef(ref) ? ref.value : ref
}

/**
 * 创建一个Ref对象
 *
 * @param value - 目标值
 * @param deep - 是否深度代理，当值为object类型时有效
 */
export function ref<T>(value: T, deep: boolean = true): Ref<T> {
  return new Ref(value, deep)
}
