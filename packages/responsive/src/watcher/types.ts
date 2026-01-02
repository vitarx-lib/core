import type { AnyFunction, VoidCallback } from '@vitarx/utils'
import type { Ref } from '../signals/index.js'
import type { WatcherOptions } from './watcher.js'

/**
 * 刷新模式类型
 *
 * 控制观察者回调函数的执行时机：
 * - 'pre': 在组件更新前执行（默认）
 * - 'post': 在组件更新后执行
 * - 'sync': 同步执行，值变化时立即执行
 */
export type FlushMode = 'pre' | 'post' | 'sync'

/**
 * 观察者清理回调函数类型
 *
 * 用于注册清理函数，在观察者下一次执行前或被停止时调用。
 *
 * @param cleanupFn - 需要执行的清理函数
 *
 * @example
 * ```typescript
 * watch(count, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => {
 *     console.log('delayed execution')
 *   }, 1000)
 *
 *   // 注册清理函数
 *   onCleanup(() => {
 *     clearTimeout(timer)
 *   })
 * })
 * ```
 */
export type WatcherOnCleanup = (cleanupFn: VoidCallback) => void

/**
 * 观察源类型
 *
 * 定义可以被观察的数据源类型，包括：
 * - 信号对象 (AnySignal)
 * - 引用对象 (RefWrapper)
 * - getter 函数 (() => T)
 * - 对象类型 (T extends object ? T : never)
 *
 * @template T - 观察源的数据类型
 */
export type WatchSource<T> = Ref<T, any> | (() => T) | (T extends object ? T : never)
/**
 * 观察源数组类型
 *
 * 观察源数组类型，用于批量观察多个数据源。
 *
 * @template T - 观察源的数据类型
 */
export type UnwarpSources<T extends any[]> = {
  [K in keyof T]: T[K] extends Ref<infer V, any>
    ? V
    : T[K] extends AnyFunction
      ? ReturnType<T[K]>
      : T[K]
}
/**
 * WatchCallback 监听回调函数的类型。
 *
 * @template T - 监听的源数据类型
 */
export type WatchCallback<T> = (newValue: T, oldValue: T, onCleanup: WatcherOnCleanup) => void

/**
 * 比较函数类型
 *
 * 用于自定义值比较逻辑的函数类型。
 *
 * @param value1 - 第一个值
 * @param value2 - 第二个值
 * @returns {boolean} 如果两个值相等返回 true，否则返回 false
 */
export type CompareFunction = (value1: any, value2: any) => boolean

/**
 * 观察选项接口
 *
 * 扩展自 WatcherOptions，提供了额外的观察配置选项。
 */
export interface WatchOptions extends WatcherOptions {
  /**
   * 是否立即执行回调函数
   *
   * @default false
   */
  immediate?: boolean
  /**
   * 是否深度监听对象
   *
   * @default false
   */
  deep?: boolean | number
  /**
   * 是否只监听一次
   *
   * @default false
   */
  once?: boolean
}
