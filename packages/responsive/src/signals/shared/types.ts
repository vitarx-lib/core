import type { AnyCollection, AnyFunction, AnyObject } from '@vitarx/utils'
import { type IS_RAW, IS_REF, IS_SIGNAL, type RAW_VALUE } from './symbol.js'

/**
 * 表示包含原始值的接口
 * 
 * @template T - 原始值的类型
 */
export interface RawValue<T> {
  readonly [RAW_VALUE]: T
}

/**
 * 表示原始对象类型，用于标识不应被包装的对象
 * 
 * @template T - 原始对象的类型，默认为任意对象
 */
export type RawObject<T extends AnyObject = AnyObject> = T & {
  readonly [IS_RAW]: true
}

/**
 * Ref 接口，用于创建响应式引用
 * 
 * @template T - 读取值的类型
 * @template S - 设置值的类型，默认与 T 相同
 */
export interface Ref<T = any, S = T> {
  readonly [IS_REF]: true
  get value(): T
  set value(value: S)
}

/**
 * RefSignal 接口，扩展自 Ref，增加了可追踪标识
 * 
 * @template T - 读取值的类型
 * @template S - 设置值的类型，默认与 T 相同
 */
export interface RefSignal<T = any, S = T> extends Ref<T, S> {
  readonly [IS_SIGNAL]: true // 可追踪标识
}

/**
 * 不应被包装的类型，包括集合、函数和原始对象
 */
type NonWrapped = AnyCollection | AnyFunction | RawObject

/**
 * 解包 Ref 类型，获取其内部值
 * 
 * @template T - 要解包的类型
 * @returns 如果 T 是 Ref 类型，则返回其内部值类型；否则返回 T
 */
export type UnwrapRef<T> = T extends Ref<infer V, any> ? V : T

/**
 * 递归解包对象中的所有 Ref 类型
 * 
 * @template T - 要解包的对象类型
 * @returns 如果 T 是 NonWrapped 类型，则直接返回 T；否则返回一个新类型，其中所有属性都被解包
 */
export type UnwrapRefs<T> = T extends NonWrapped ? T : { [K in keyof T]: UnwrapRef<T[K]> }

/**
 * 深度递归解包对象中的所有 Ref 类型
 * 
 * @template T - 要解包的对象类型
 * @returns 如果 T 是 NonWrapped 类型，则直接返回 T；否则返回一个新类型，其中所有属性都被深度解包
 */
export type DeepUnwrapRefs<T> = T extends NonWrapped
  ? T
  : { [K in keyof T]: T[K] extends Ref<infer V, any> ? V : DeepUnwrapRefs<T[K]> }
