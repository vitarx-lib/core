import type { AnyCollection, AnyFunction, AnyObject } from '@vitarx/utils'
import { type IS_RAW, IS_REF, IS_SIGNAL, type RAW_VALUE } from './symbol.js'

export interface RawValue<T> {
  readonly [RAW_VALUE]: T
}

export type RawObject<T extends AnyObject = AnyObject> = T & {
  readonly [IS_RAW]: true
}
export interface Ref<T = any, S = T> {
  readonly [IS_REF]: true
  get value(): T
  set value(value: S)
}
export interface RefSignal<T = any, S = T> extends Ref<T, S> {
  readonly [IS_SIGNAL]: true // 可追踪标识
}
type NonWrapped = AnyCollection | AnyFunction | RawObject
export type UnwrapRef<T> = T extends Ref<infer V, any> ? V : T
export type UnwrapRefs<T> = T extends NonWrapped ? T : { [K in keyof T]: UnwrapRef<T[K]> }
export type DeepUnwrapRefs<T> = T extends NonWrapped
  ? T
  : { [K in keyof T]: T[K] extends Ref<infer V, any> ? V : DeepUnwrapRefs<T[K]> }
