import { isCollection, isFunction, isObject } from '../../utils/index.js'
import { Observers } from '../observer/index.js'
import { PROXY_SYMBOL } from './constants.js'
import {
  type ExtractProp,
  isMakeProxy,
  isProxy,
  isValueProxy,
  type ProxySymbol,
  type ValueProxy
} from './helper.js'
import { isRef } from './ref.js'
import { Depend } from './depend.js'

/** 响应式对象的标识 */
export const REACTIVE_SYMBOL = Symbol('REACTIVE_SYMBOL')
/** 代理原始对象标识符 */
export const GET_RAW_TARGET_SYMBOL = Symbol('VITARX_PROXY_RAW_TARGET_SYMBOL')

/**
 * 响应式对象标识接口
 *
 * @template T - 原始对象
 * @template D - 是否深度监听
 * @property {boolean} [PROXY_DEEP_SYMBOL] - 是否深度监听标识
 * @property {true} [PROXY_SYMBOL] - 是否为代理对象标识
 * @property {T} [GET_RAW_TARGET_SYMBOL] - 获取原始对象标识
 * @property {true} [REACTIVE_SYMBOL] - 响应式对象标识
 */
export interface ReactiveSymbol<T extends AnyObject> extends ProxySymbol {
  readonly [REACTIVE_SYMBOL]: true
  readonly [GET_RAW_TARGET_SYMBOL]: T
}

/** 触发监听器 */
export type Trigger<T> = (prop: ExtractProp<T> | ExtractProp<T>[]) => void
/** 跟踪依赖 */
export type Track<T> = (prop: ExtractProp<T>) => void
/** 解包嵌套的ref */
export type UnwrapNestedRefs<T extends object> = {
  [K in keyof T]: T[K] extends ValueProxy<infer U> ? U : T[K]
}
/** 浅层reactive类型 */
export type ShallowReactive<T extends AnyObject = AnyObject> = T & ReactiveSymbol<T>
/** 深层reactive类型 */
export type Reactive<T extends AnyObject = AnyObject> = UnwrapNestedRefs<T> & ReactiveSymbol<T>
/** 解除响应式对象 */
export type UnReactive<T> =
  T extends Reactive<infer U> ? U : T extends ShallowReactive<infer U> ? U : T

/** 响应式对象处理器配置 */
export type ReactiveHandlerOptions<T extends AnyObject> = {
  deep: boolean
  trigger: Trigger<T>
  track: Track<T>
}

/**
 * 处理集合对象方法
 *
 * @param target - 目标集合
 * @param fn - 方法名
 * @param trigger - 触发器
 * @param track - 跟踪器
 */
const handlerCollection = <T extends AnyCollection>(
  target: T,
  fn: string,
  trigger: Trigger<{
    size: number
  }>,
  track: Track<any>
): Function => {
  switch (fn) {
    case 'set':
      return function (key: any, value: any): T {
        if (value !== (target as AnyMap).get?.(key)) {
          ;(target as AnyMap).set(key, value)
          trigger('size')
        }
        return target
      }
    case 'add':
      return function (value: any): T {
        ;(target as AnySet).add(value)
        trigger('size')
        return target
      }
    case 'delete':
      return function (key: any): boolean {
        if (target.delete(key)) {
          trigger('size')
          return true
        }
        return false
      }
    case 'clear':
      return function (): void {
        ;(target as AnySet).clear()
        trigger('size')
      }
    default:
      // 除了上述会改变集合长度的方法，都被视为获取集合数据，统一认定为跟踪size属性
      track('size')
      return Reflect.get(target, fn) as Function
  }
}

/**
 * # 响应式对象处理
 */
export class ReactiveHandler<T extends AnyObject> implements ProxyHandler<T> {
  private readonly _deep: boolean
  private readonly _trigger: Trigger<T>
  private readonly _track: Track<T>
  #deepProxy?: Map<string | symbol, Reactive>
  /**
   * 构造函数
   *
   * @param deep - 是否深度监听
   * @param trigger - 触发器
   * @param track - 跟踪器
   * @param readonly - 是否只读
   */
  constructor({ deep, trigger, track }: ReactiveHandlerOptions<T>) {
    this._deep = deep
    this._trigger = trigger
    this._track = track
  }

  deleteProperty(target: T, prop: ExtractProp<T>): boolean {
    const result = Reflect.deleteProperty(target, prop)
    // 移除深度代理
    if (this.#deepProxy?.has(prop)) this.#deepProxy.delete(prop)
    if (result) this._trigger(prop)
    return result
  }

  get(target: T, prop: ExtractProp<T>, receiver: any) {
    // 检测是否为代理对象
    if (prop === PROXY_SYMBOL) return true
    // 检测是否为响应式对象
    if (prop === REACTIVE_SYMBOL) return true
    // 获取原始对象
    if (prop === GET_RAW_TARGET_SYMBOL) return target
    // 返回监听目标undefined，表示监听代理对象
    if (prop === Observers.OBSERVERS_TARGET_SYMBOL) return undefined
    // 如果存在于深度代理中，则直接返回代理对象
    if (Reflect.has(target, prop) && this.#deepProxy?.has(prop)) return this.#deepProxy.get(prop)
    const value = Reflect.get(target, prop)
    if (isFunction(value)) {
      // 集合目标函数需特殊处理
      return isCollection(target)
        ? handlerCollection(target, prop, this._trigger as any, this._track).bind(target)
        : value.bind(receiver)
    }
    // 如果是对象，则判断是否需要进行深度代理
    if (this._deep && isMakeProxy(value)) {
      const proxy = createReactive(value, {
        deep: this._deep,
        trigger: () => this._trigger(prop)
      })
      if (this.#deepProxy) {
        this.#deepProxy.set(prop, proxy)
      } else {
        this.#deepProxy = new Map([[prop, proxy]])
      }
      // 返回代理对象
      return proxy
    }
    // 非代理对象，则跟踪依赖
    if (!isProxy(value)) this._track(prop)
    // 如果是引用类型，则返回引用
    return this._deep && isRef(value) ? value.value : value
  }

  has(target: T, prop: ExtractProp<T>): boolean {
    this._track(prop)
    return Reflect.has(target, prop)
  }

  set(target: T, prop: ExtractProp<T>, newValue: any, receiver: any): boolean {
    // 处理数组长度修改
    if (prop === 'length' && Array.isArray(target)) {
      const oldLength = target.length // 旧长度
      const result = Reflect.set(target, prop, newValue, receiver)
      if (result) {
        const newLength = target.length // 新长度
        if (newLength < oldLength) {
          // 计算被删除的下标
          for (let i = newLength; i < oldLength; i++) {
            const strIndex = i.toString()
            // 移除深度代理
            if (this.#deepProxy?.has(strIndex)) this.#deepProxy.delete(strIndex)
          }
        }
        this._trigger(prop)
      }
      return result
    }
    const oldValue = Reflect.get(target, prop)
    // 处理ref类型
    if (isRef(oldValue)) {
      if (oldValue.value !== newValue) {
        oldValue.value = newValue
        this._trigger(prop)
      }
    } else if (oldValue !== newValue || !target.hasOwnProperty(prop)) {
      // 移除深度代理
      if (this.#deepProxy?.has(prop)) this.#deepProxy.delete(prop)
      const result = Reflect.set(target, prop, newValue, receiver)
      if (result) this._trigger(prop)
      return result
    }
    return true
  }
}

/**
 * 创建响应式代理对象
 *
 * @param target - 目标对象
 * @param options - 可选配置
 * @param [options.trigger] - 额外的触发器，
 * @param [options.readonly=false] - 是否只读
 * @param [options.deep=false] - 是否深度代理
 * @internal 此函数由系统内部使用，开发者不应该使用此函数！。
 */
export function createReactive<T extends AnyObject>(
  target: T,
  options?: { trigger?: VoidFunction; deep?: boolean }
): Reactive<T> | ShallowReactive<T> {
  if (!isObject(target)) {
    throw new TypeError('参数1(target)必须是一个对象！')
  }
  if (Object.isFrozen(target)) {
    throw new TypeError('参数1(target)不能是一个冻结对象！')
  }
  const { trigger, deep = false } = options || {}
  // 避免嵌套代理
  if (isValueProxy(target)) {
    throw new TypeError('参数1(target)不能是一个值代理对象！')
  }
  if (isReactive(target)) return target as Reactive<T>
  const proxy = new Proxy(
    target,
    new ReactiveHandler<T>({
      deep,
      trigger: trigger
        ? prop => {
            Observers.trigger(proxy, prop)
            trigger()
          }
        : prop => {
            Observers.trigger(proxy, prop)
          },
      track: prop => {
        Depend.track(proxy, prop)
      }
    })
  )
  return proxy as Reactive<T>
}

/**
 * 判断是否为响应式对象
 *
 * @param val
 */
export function isReactive(val: unknown): boolean {
  return typeof val === 'object' && val !== null && !!Reflect.get(val, REACTIVE_SYMBOL)
}

/**
 * ## 解除响应式代理，返回真实对象
 *
 * @template T - 对象类型
 * @param obj - 响应式对象
 * @returns {UnReactive<T>} 如果传入的是 'reactive' 创建的对象，则会返回其真实的原始对象，否则原样返回。
 * @alias toRaw
 */
export function unReactive<T extends object>(obj: T | Reactive<T>): UnReactive<T> {
  return ((obj as any)?.[GET_RAW_TARGET_SYMBOL] as UnReactive<T>) ?? obj
}

/**
 * ## 创建浅层响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 * @param {boolean} deep - 设置为false，代表浅层代理
 */
export function reactive<T extends AnyObject>(target: T, deep: false): ShallowReactive<T>
/**
 * ## 创建深层响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 */
export function reactive<T extends AnyObject>(target: T): Reactive<T>
/**
 * ## 创建深层响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 * @param {boolean} deep - 设置为true，代表深层代理
 */
export function reactive<T extends AnyObject>(target: T, deep: true): ShallowReactive<T>
/**
 * ## 创建响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 * @param {boolean} [deep=true] - 是否深度代理子对象，默认为true
 */
export function reactive<T extends AnyObject>(
  target: T,
  deep: boolean = true
): Reactive<T> | ShallowReactive<T> {
  return createReactive(target, { deep })
}

/**
 * ## 创建浅层响应式对象
 *
 * 该方法与`reactive({},false)`的效果是一致的。
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 */
export function shallowReactive<T extends AnyObject>(target: T): ShallowReactive<T> {
  return createReactive(target, { deep: false }) as ShallowReactive<T>
}

/**
 * ## 获取响应式对象的原始值，
 *
 * @template T
 * @param obj
 * @returns {UnReactive<T>} 如果传入的是 'reactive' 创建的对象，则会返回其真实的原始对象，否则原样返回。
 * @alias unReactive
 */
export function toRaw<T extends object>(obj: T | Reactive<T>): UnReactive<T> {
  return unReactive(obj) as UnReactive<T>
}
