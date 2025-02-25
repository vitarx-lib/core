import { isCollection, isFunction, isObject } from '../../utils/index.js'
import { Observers } from '../observer/index.js'
import { PROXY_SYMBOL } from './constants.js'
import {
  type ExtractProp,
  isMakeProxy,
  isProxy,
  type ProxySymbol,
  type ValueProxy
} from './helper.js'
import { isRef } from './ref.js'
import { Depend } from './depend.js'
import Logger from '../logger.js'

/** 响应式对象的标识 */
export const REACTIVE_SYMBOL = Symbol('REACTIVE_SYMBOL')
/** 响应式只读对象的标识 */
export const READONLY_REACTIVE_SYMBOL = Symbol('READONLY_REACTIVE_SYMBOL')
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
  readonly [READONLY_REACTIVE_SYMBOL]: boolean
}

/** 触发监听器 */
export type Trigger<T> = (prop: ExtractProp<T> | ExtractProp<T>[]) => void
/** 跟踪依赖 */
export type Track<T> = (prop: ExtractProp<T>) => void
/** 解包嵌套的ref */
export type UnwrapNestedRefs<T extends object> = {
  [K in keyof T]: T[K] extends ValueProxy<infer U> ? U : T[K]
}
/** reactive 接口 */
export type Reactive<T extends AnyObject = AnyObject> = UnwrapNestedRefs<T> & ReactiveSymbol<T>
/** 解除响应式对象 */
export type UnReactive<T> = T extends Reactive<infer U> ? U : T

/** 响应式对象处理器配置 */
export type ReactiveHandlerOptions<T extends AnyObject> = {
  deep: boolean
  trigger: Trigger<T>
  track: Track<T>
  readonly?: boolean
}
/**
 * 只读代理
 */
class ReadonlyProxy {
  static #cache = new WeakMap()

  /**
   * 创建只读代理
   *
   * @param target
   * @param deep
   */
  static create<T extends Object>(target: T, deep: boolean): T {
    if (!this.#cache.has(target)) {
      this.#cache.set(
        target,
        new Proxy(target, {
          set(): boolean {
            Logger.warn('响应式对象是只读的，不可修改属性！')
            return true
          },
          deleteProperty(): boolean {
            Logger.warn('响应式对象是只读的，不可删除属性！')
            return true
          },
          get(target: T, prop: ExtractProp<T>, receiver: any): any {
            // 只读标识
            if (prop === READONLY_REACTIVE_SYMBOL) return true
            // 返回监听目标
            if (prop === Observers.OBSERVERS_TARGET_SYMBOL) return target
            const data = Reflect.get(target, prop, receiver)
            if (deep && isObject(data) && !isReadonly(data)) {
              return ReadonlyProxy.create(data, true)
            }
            return data
          }
        })
      )
    }
    return this.#cache.get(target)!
  }
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
  readonly #deep: boolean
  readonly #trigger: Trigger<T>
  readonly #track: Track<T>
  readonly #readonly: boolean
  #deepProxy?: Map<string | symbol, Reactive>
  /**
   * 构造函数
   *
   * @param deep - 是否深度监听
   * @param trigger - 触发器
   * @param track - 跟踪器
   * @param readonly - 是否只读
   */
  constructor({ deep, trigger, track, readonly = false }: ReactiveHandlerOptions<T>) {
    this.#deep = deep
    this.#trigger = trigger
    this.#track = track
    this.#readonly = readonly
  }

  deleteProperty(target: T, prop: ExtractProp<T>): boolean {
    if (this.#readonly) {
      Logger.warn('响应式对象是只读的，不能删除属性！')
      return true
    }
    const result = Reflect.deleteProperty(target, prop)
    // 移除深度代理
    if (this.#deepProxy?.has(prop)) this.#deepProxy.delete(prop)
    if (result) this.#trigger(prop)
    return result
  }

  get(target: T, prop: ExtractProp<T>, receiver: any) {
    // 检测是否为代理对象
    if (prop === PROXY_SYMBOL) return true
    // 检测是否为响应式对象
    if (prop === REACTIVE_SYMBOL) return true
    // 检测是否为只读响应式对象
    if (prop === READONLY_REACTIVE_SYMBOL) return this.#readonly
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
        ? handlerCollection(target, prop, this.#trigger as any, this.#track).bind(target)
        : value.bind(receiver)
    }
    // 如果是对象，则判断是否需要进行深度代理
    if (this.#deep && isMakeProxy(value)) {
      const proxy = createReactive(value, {
        deep: this.#deep,
        trigger: () => this.#trigger(prop),
        readonly: this.#deep ? this.#readonly : false
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
    if (!isProxy(value)) this.#track(prop)
    // 如果是引用类型，则返回引用
    return isRef(value) ? value.value : value
  }

  has(target: T, prop: ExtractProp<T>): boolean {
    this.#track(prop)
    return Reflect.has(target, prop)
  }

  set(target: T, prop: ExtractProp<T>, newValue: any, receiver: any): boolean {
    if (this.#readonly) {
      Logger.warn('响应式对象是只读的，不可修改属性！')
      return true
    }
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
        this.#trigger(prop)
      }
      return result
    }
    const oldValue = Reflect.get(target, prop)
    // 处理ref类型
    if (isRef(oldValue)) {
      if (oldValue.value !== newValue) {
        oldValue.value = newValue
        this.#trigger(prop)
      }
    } else if (oldValue !== newValue || !target.hasOwnProperty(prop)) {
      // 移除深度代理
      if (this.#deepProxy?.has(prop)) this.#deepProxy.delete(prop)
      const result = Reflect.set(target, prop, newValue, receiver)
      if (result) this.#trigger(prop)
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
 * @internal 此函数由系统内部使用，开发者不应该使用此函数！。
 */
export function createReactive<T extends AnyObject>(
  target: T,
  options?: { trigger?: VoidFunction; readonly?: boolean; deep?: boolean }
): Reactive<T> {
  if (!isObject(target)) {
    throw new TypeError('参数1(target)必须是一个对象！')
  }
  if (Object.isFrozen(target)) {
    throw new TypeError('参数1(target)不能是一个冻结对象！')
  }
  const { trigger, readonly, deep = false } = options || {}
  // 避免嵌套代理
  if (isReactive(target)) {
    if (readonly && !isReadonly(target)) {
      return ReadonlyProxy.create(target, deep) as Reactive<T>
    }
    return target
  }
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
      },
      readonly
    })
  )
  return proxy as Reactive<T>
}

/**
 * 判断是否为响应式对象
 *
 * @param val
 */
export function isReactive<T extends object>(val: T | Reactive<T>): val is Reactive<T> {
  return typeof val === 'object' && !!Reflect.get(val, REACTIVE_SYMBOL)
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
  if (isReactive(obj)) {
    return obj[GET_RAW_TARGET_SYMBOL] as UnReactive<T>
  }
  return obj as UnReactive<T>
}

/**
 * ## 创建响应式对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 * @param {boolean} deep - 是否深度代理子对象，默认为true
 */
export function reactive<T extends AnyObject>(target: T, deep: boolean = true): Reactive<T> {
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
export function shallowReactive<T extends AnyObject>(target: T): Reactive<T> {
  return createReactive(target)
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

/**
 * 深度只读响应式对象
 *
 * @param {Object} target - 任意对象
 * @returns {Object}
 */
export function readonly<T extends AnyObject>(target: T): DeepReadonly<UnwrapNestedRefs<T>> {
  return createReactive(target, { readonly: true, deep: true })
}

/**
 * 浅层只读响应式对象
 *
 * @param {Object} target - 任意对象
 * @returns {Object}
 */
export function shallowReadonly<T extends AnyObject>(target: T): Readonly<UnwrapNestedRefs<T>> {
  return createReactive(target, { readonly: true })
}

/**
 * 判断对象是否为只读响应式对象
 *
 * @param obj
 */
export function isReadonly<T extends object>(obj: T): boolean {
  return isReactive(obj) && Reflect.get(obj, READONLY_REACTIVE_SYMBOL)
}
