import type { AnyFunction, VoidCallback } from '@vitarx/utils'
import { EFFECT_DEP_HEAD, EFFECT_DEP_TAIL } from '../constants/index.js'
import type { DepLink } from '../depend/index.js'
import type { WatcherOptions } from '../observer/index.js'
import type { DebuggerHandler } from './debug.js'
import type { Signal } from './signal/index.js'

/**
 * DepEffect 接口定义了响应式依赖的副作用对象
 *
 * 这个接口是响应式系统的核心，它管理着信号(signal)和观察者(watcher)之间的关系，
 * 并提供了调试和调度功能。当依赖的信号值发生变化时，会触发相应的副作用。
 */
export interface DepEffect {
  /**
   * signal → watcher 链表头
   *
   * 用于维护信号到观察者的双向链表结构的起始节点。
   * 这是依赖系统的核心数据结构，用于高效地管理依赖关系。
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [EFFECT_DEP_HEAD]?: DepLink
  /**
   * signal → watcher 链表尾
   *
   * 用于维护信号到观察者的双向链表结构的末尾节点。
   * 这是依赖系统的核心数据结构，用于高效地管理依赖关系。
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [EFFECT_DEP_TAIL]?: DepLink
  /**
   * trigger调试钩子 - 触发信号
   *
   * 当信号值发生变化并触发依赖更新时调用此钩子函数。
   * 可用于调试和监控依赖系统的运行状态。
   *
   * @param event - 调试事件对象，包含触发相关的调试信息
   */
  onTrigger?: DebuggerHandler
  /**
   * track调试钩子 - 跟踪信号
   *
   * 当响应式系统跟踪到新的依赖关系时调用此钩子函数。
   * 可用于调试和监控依赖收集的过程。
   *
   * @param event - 调试事件对象，包含跟踪相关的调试信息
   */
  onTrack?: DebuggerHandler
  /**
   * 调度触发器
   *
   * 当依赖的信号发生变化时，响应式系统会调用此方法来调度更新。
   * 所有的监听器都必须实现此方法，用于触发适当的更新调度。
   *
   * 实现此方法时，通常需要考虑批处理、异步更新等优化策略。
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
