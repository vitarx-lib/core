import { AnyCollection, AnyMap, AnyObject, AnySet } from '../../types/common'
import { isCollection, isFunction, isObject } from '../../utils'
import { Observers } from '../observers'
import { ExtractProp, isProxy, isRef, type ProxySymbol } from './index'
import { PROXY_SYMBOL } from './constants.js'

/** 响应式对象的标识 */
export const REACTIVE_SYMBOL = Symbol('reactive')

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

type Trigger<T> = (prop: ExtractProp<T>) => void
/** reactive 接口 */
export type Reactive<T extends AnyObject> = T & ReactiveSymbol<T>

/** 解除响应式对象 */
export type UnReactive<T> = T extends Reactive<infer U> ? U : T

/**
 * 处理集合对象方法
 *
 * @param target
 * @param fn
 * @param trigger
 */
function handlerCollection<T extends AnyCollection>(
  target: T,
  fn: string,
  trigger: Trigger<{
    size: number
  }>
): Function {
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
      return Reflect.get(target, fn) as Function
  }
}

/**
 * # 响应式对象处理
 */
class ReactiveHandler<T extends AnyObject> implements ProxyHandler<T> {
  readonly #deep: boolean
  readonly #trigger: Trigger<T>

  /**
   * 构造函数
   *
   * @param deep - 是否深度监听
   * @param trigger - 触发器
   */
  constructor(deep: boolean, trigger: Trigger<T>) {
    this.#deep = deep
    this.#trigger = trigger
  }

  get(target: T, prop: ExtractProp<T>, receiver: any) {
    // 检测是否为响应式对象
    if (prop === REACTIVE_SYMBOL) return true
    // 检测是否为代理对象
    if (prop === PROXY_SYMBOL) return true
    // 获取原始对象
    if (prop === GET_RAW_TARGET_SYMBOL) return target
    const value = Reflect.get(target, prop, receiver)
    // 如果是函数则绑定this为target
    if (isFunction(value)) {
      return isCollection(target)
        ? handlerCollection(target, prop, this.#trigger as any).bind(target)
        : value.bind(target)
    }
    // 如果是对象，则判断是否需要进行深度代理
    if (this.#deep && isObject(value) && !isProxy(value)) {
      const proxy = createReactive(value, this.#deep, () => this.#trigger(prop))
      // 替换原始对象为代理对象
      Reflect.set(target, prop, proxy)
      // 返回代理对象
      return Reflect.get(target, prop)
    }
    // 如果是引用类型，则返回引用
    return isRef(value) ? value.value : value
  }

  set(target: T, prop: ExtractProp<T>, newValue: any, receiver: any): boolean {
    let oldValue = Reflect.get(target, prop, receiver)

    if (oldValue.value !== newValue) {
      if (isRef(oldValue)) {
        oldValue.value = newValue
        this.#trigger(prop)
      } else {
        const result = Reflect.set(target, prop, newValue, receiver)
        if (result) this.#trigger(prop)
        return result
      }
    }
    return true
  }

  deleteProperty(target: T, prop: ExtractProp<T>): boolean {
    const result = Reflect.deleteProperty(target, prop)
    if (result) this.#trigger(prop)
    return result
  }
}

/**
 * 创建响应式代理对象
 *
 * @param target
 * @param deep
 * @param trigger
 */
export function createReactive<T extends AnyObject>(
  target: T,
  deep: boolean = true,
  trigger?: () => void
): Reactive<T> {
  const proxy = new Proxy(
    target,
    new ReactiveHandler<T>(
      deep,
      trigger
        ? (prop: ExtractProp<T>) => {
            Observers.trigger(proxy, prop)
            trigger?.()
          }
        : (prop: ExtractProp<T>) => {
            Observers.trigger(proxy, prop)
          }
    )
  ) as Reactive<T>
  return proxy
}

/**
 * 判断是否为响应式对象
 *
 * @param val
 */
export function isReactive(val: any): val is Reactive<object> {
  return typeof val === 'object' && Reflect.get(val, REACTIVE_SYMBOL)
}

/**
 * ## 解除响应式代理，返回真实对象
 *
 * @template T
 * @param obj - 响应式对象
 * @returns {UnReactive<T>} 如果传入的是 'reactive' 创建的对象，则会返回其真实的原始对象，否则原样返回。
 */
export function unReactive<T extends object>(obj: T | Reactive<T>): T {
  return isReactive(obj) ? obj[GET_RAW_TARGET_SYMBOL] : obj
}

/**
 * ## 创建响应式对象
 *
 * @template T
 * @param {T} target - 目标对象
 * @param {boolean} deep - 是否深度代理子对象，默认为true
 */
export function reactive<T extends AnyObject>(target: T, deep: boolean = true): Reactive<T> {
  return createReactive(target, deep)
}
