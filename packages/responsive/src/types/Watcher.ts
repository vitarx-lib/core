import type { AnyFunction, VoidCallback } from '@vitarx/utils'
import type { DEP_LINK_HEAD, DEP_LINK_TAIL } from '../constants/index.js'
import type { DepLink } from '../depend/index.js'
import type { WatcherOptions } from '../observer/index.js'
import type { DebuggerHandler } from './debug.js'
import type { Signal } from './signal/index.js'

export interface DepEffect {
  /**
   * signal → watcher 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [DEP_LINK_HEAD]?: DepLink
  /**
   * signal → watcher 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [DEP_LINK_TAIL]?: DepLink
  /**
   * trigger调试钩子 - 触发信号
   *
   * @param event - 调试事件
   */
  onTrigger?: DebuggerHandler
  /**
   * track调试钩子 - 跟踪信号
   *
   * @param event - 调试事件
   */
  onTrack?: DebuggerHandler
  /**
   * 调度触发器
   *
   * 监听器必须实现此方法，用于触发调度。
   */
  schedule(): void
}
export type FlushMode = 'pre' | 'post' | 'sync'
export type WatcherOnCleanup = (cleanupFn: VoidCallback) => void
export type WatchSource<T> = Signal<T> | (() => T) | (T extends object ? T : never)
export type UnwrapGetter<T> = T extends AnyFunction ? ReturnType<T> : T
export type UnwrapSource<T> = T extends Signal<infer V> ? V : UnwrapGetter<T>
export type CallbackValue<T> = {
  [K in keyof T]: T[K] extends WatchSource<infer V> ? UnwrapSource<V> : UnwrapSource<T[K]>
}
export type WatchCallback<T, Immediate extends boolean = false> = (
  newValue: Immediate extends false ? T : CallbackValue<T>,
  oldValue: Immediate extends false ? T : CallbackValue<T>,
  onCleanup: WatcherOnCleanup
) => void

export type CompareFunction = (value1: any, value2: any) => boolean

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
