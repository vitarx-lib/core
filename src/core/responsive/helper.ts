// 代理标识符
import { type Ref } from './ref.js'
import { type Reactive, type ReactiveSymbol, type UnReactive } from './reactive.js'
import {
  PROXY_DEEP_SYMBOL,
  PROXY_SYMBOL,
  UN_PROXY_SYMBOL,
  VALUE_PROXY_SYMBOL
} from './constants.js'
import { isObject } from '../../utils/index.js'

/**
 * 代理标识接口
 */
export interface ProxySymbol {
  /** 代理标识符 */
  readonly [PROXY_SYMBOL]: true
  /** 深度代理标识符 */
  readonly [PROXY_DEEP_SYMBOL]: boolean
}

/**
 * 值代理对象需实现的接口
 */
export interface ValueProxy<T> extends ProxySymbol {
  readonly [VALUE_PROXY_SYMBOL]: true

  get value(): T

  set value(newValue: T)
}

/** 属性类型 */
export type PropName = string | symbol | number
/** 任意代理对象 */
export type AnyProxy = Ref | Reactive | (AnyObject & ProxySymbol)
/** 解除代理对象，不区分`Ref`、`Reactive` */
export type UnProxy<T> = T extends ValueProxy<infer U> ? U : UnReactive<T>
/** 从类型中排除代理标识符 */
export type ExcludeProxyProp<T> = Exclude<T, keyof ProxySymbol | keyof ReactiveSymbol<AnyObject>>
/** 从代理对象中提取出属性的联合类型 */
export type ExtractProp<T> = T extends AnyCollection
  ? 'size'
  : T extends ValueProxy<any>
    ? 'value'
    : T extends any[]
      ? `${number}` | 'length'
      : ExcludeProxyProp<keyof T>

/**
 * ## 判断是否为代理对象
 *
 * 该方法不区分`Ref`、`Reactive`。
 *
 * @param {any} val - 任意变量
 */
export function isProxy(val: any): val is AnyProxy {
  return val?.[PROXY_SYMBOL] === true
}

/**
 * 判断是否为深度代理对象
 *
 * @param proxy
 */
export function isDeepProxy(proxy: ProxySymbol): boolean {
  return proxy?.[PROXY_DEEP_SYMBOL]
}

/**
 * 判断是否为值代理对象，例如`Ref`、`Computed`
 *
 * @param val
 */
export function isValueProxy(val: any): val is ValueProxy<any> {
  return val?.[VALUE_PROXY_SYMBOL] === true
}

/**
 * 标记为不可代理对象
 *
 * 它与`shallowReactive`有异曲同工之妙，`shallowReactive`是不代理所有子对象，
 * 而`markRaw`则是标记某个子对象不被代理，通常这个标记为不被代理的对象是不可变的。
 *
 * @param {AnyObject} obj - 任意对象！
 */
export function markRaw<T extends AnyObject>(obj: T): T {
  Object.defineProperty(obj, UN_PROXY_SYMBOL, {
    value: true
  })
  return obj
}

/**
 * 判断是否为不可代理对象
 *
 * @param obj
 * @returns {boolean} - true为是不可代理对象，false则不是
 */
export function isMarkRaw(obj: AnyObject): boolean {
  return !!(obj as any)[UN_PROXY_SYMBOL]
}

/**
 * 判断是否需要代理对象
 *
 * @param {any} value
 * @internal 内部使用的助手函数！
 */
export function isMakeProxy(value: any): value is object {
  return isObject(value) && !isProxy(value) && !isMarkRaw(value) && !Object.isFrozen(value)
}
