import type { VoidCallback } from '@vitarx/utils'
import type { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink } from '../depend/index.js'
import type { Effect } from '../effect/index.js'
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
   * 触发器
   */
  trigger(): void
}
export type FlushMode = 'pre' | 'post' | 'sync'
export type WatcherOnCleanup = (cleanupFn: VoidCallback) => void
export type ChangeCallback<T> = (newValue: T, oldValue: T, onCleanup: WatcherOnCleanup) => void
