import type { ProxySignal, SignalOptions, ValueSignal } from '../types'

/** 解包嵌套的ref */
export type UnwrapNestedRefs<T extends AnyObject> = {
  [K in keyof T]: T[K] extends ValueSignal<infer U> ? U : T[K]
}
/**
 * 响应式代理对象类型
 */
export type Reactive<T extends AnyObject = {}> = ProxySignal<T, UnwrapNestedRefs<T>>
/**
 * 浅响应式代理对象类型
 */
export type ShallowReactive<T extends AnyObject = {}> = ProxySignal<T>

/**
 * 响应式代理信号可选配置选项
 */
export type ReactiveOptions<Deep extends boolean = boolean> = Omit<SignalOptions, 'deep'> & {
  deep?: Deep
}

/** 解除响应式对象 */
export type UnReactive<T> = T extends Reactive<infer U> | ShallowReactive<infer U> ? U : T
