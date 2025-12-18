import type { AnyFunction, VoidCallback } from '@vitarx/utils'
import { EFFECT_DEP_HEAD, EFFECT_DEP_TAIL } from '../constants/index.js'
import type { DepLink } from '../depend/index.js'
import type { WatcherOptions } from '../watcher/index.js'
import type { DebuggerHandler } from './debug.js'
import type { AnySignal, RefWrapper } from './signal/index.js'

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
export type WatchSource<T> =
  | AnySignal<T>
  | RefWrapper<T>
  | (() => T)
  | (T extends object ? T : never)

/**
 * 解包函数返回值类型工具
 *
 * 如果 T 是函数类型，则返回该函数的返回值类型；
 * 否则直接返回 T 本身。
 *
 * @template T - 泛型参数
 *
 * @example
 * ```typescript
 * type A = UnwrapGetter<() => string> // string
 * type B = UnwrapGetter<number> // number
 * ```
 */
export type UnwrapGetter<T> = T extends AnyFunction ? ReturnType<T> : T

/**
 * 解包观察源类型工具
 *
 * 如果 T 是信号或引用类型，则提取其内部值类型；
 * 否则如果是函数类型，则返回函数的返回值类型；
 * 否则直接返回 T 本身。
 *
 * @template T - 泛型参数
 */
export type UnwrapSource<T> = T extends AnySignal<T> | RefWrapper<infer V> ? V : UnwrapGetter<T>

/**
 * 回调值类型工具
 *
 * 用于解包观察源数组中每个元素的值类型。
 *
 * @template T - 观察源数组类型
 */
export type CallbackValue<T> = {
  [K in keyof T]: T[K] extends WatchSource<infer V> ? UnwrapSource<V> : UnwrapSource<T[K]>
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
