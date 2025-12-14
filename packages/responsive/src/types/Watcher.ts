import type { VoidCallback } from '@vitarx/utils'
import type { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink } from '../depend/index.js'
import type { Effect, EffectOptions } from '../effect/index.js'
import type { DebuggerHandler } from './debug.js'

export interface IWatcher extends Effect {
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
export type ChangeCallback<T> = (newValue: T, oldValue: T, onCleanup: WatcherOnCleanup) => void

/**
 * 观察器配置选项接口
 *
 * 该接口扩展了 EffectOptions，提供了专门用于观察器的额外配置选项。
 */
export interface WatcherOptions extends EffectOptions {
  /** trigger 调试钩子 */
  onTrigger?: DebuggerHandler
  /** track 调试钩子 */
  onTrack?: DebuggerHandler
  /**
   * 指定副作用执行时机
   *
   * - 'pre'：在主任务之前执行副作用
   * - 'post'：在主任务之后执行副作用
   * - 'sync'：同步执行副作用
   *
   * @default 'pre'
   */
  flush?: FlushMode
  /**
   * 是否只允许运行一次
   *
   * 当设置为 true 时，回调函数只会在第一次信号值变化时执行，
   * 之后观察器将自动停止并释放资源。
   *
   * @default false
   * @example
   * ```typescript
   * const count = signal(0);
   * const watcher = new SignalWatcher(count, (newValue, oldValue) => {
   *   console.log(`Changed from ${oldValue} to ${newValue}`); // 只会执行一次
   * }, { once: true, flush:'sync' });
   *
   * signal(1); // 触发回调: Changed from 0 to 1
   * signal(2); // 不会触发回调，因为观察器已经停止
   * ```
   */
  once?: boolean
}

/**
 * WatchOptions 观察器配置选项接口
 *
 * 该接口扩展了 WatcherOptions，提供了专门用于信号观察的额外配置选项。
 *
 * @extends WatcherOptions
 */
export interface WatchOptions extends WatcherOptions {
  /**
   * 是否立即执行回调函数
   *
   * 当设置为 true 时，观察器创建后会立即执行一次回调函数，
   * 无需等待信号值发生变化。回调函数接收当前值作为新值。
   *
   * @default false
   * @example
   * ```typescript
   * const signal = new Signal(10);
   * const watcher = new SignalWatcher(signal, (newValue, oldValue) => {
   *   console.log(`Value: ${newValue}`); // 立即输出: Value: 10
   * }, { immediate: true });
   * ```
   */
  immediate?: boolean
  /**
   * 是否只触发一次回调
   *
   * 当设置为 true 时，回调函数只会在第一次信号值变化时执行，
   * 之后观察器将自动停止并释放资源。
   *
   * @default false
   * @example
   * ```typescript
   * const signal = new Signal(0);
   * const watcher = new SignalWatcher(signal, (newValue, oldValue) => {
   *   console.log(`Changed from ${oldValue} to ${newValue}`); // 只会执行一次
   * }, { once: true,flush:'sync' });
   *
   * signal.value = 1; // 触发回调: Changed from 0 to 1
   * signal.value = 2; // 不会触发回调，因为观察器已经停止
   * ```
   */
  once?: boolean
}
