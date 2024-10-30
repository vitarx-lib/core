// 代理标识符
import { type Ref } from './ref.js'
import type { Reactive, ReactiveSymbol, UnReactive } from './reactive.js'
import { PROXY_DEEP_SYMBOL, PROXY_SYMBOL, VALUE_PROXY_SYMBOL } from './constants.js'
import type { AnyCollection, AnyObject } from '../../types/common'

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
  : T extends Ref
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
  return typeof val === 'object' && val[PROXY_SYMBOL] === true
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
  return typeof val === 'object' && val[VALUE_PROXY_SYMBOL] === true
}
