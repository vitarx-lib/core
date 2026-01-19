import { queueJob, queuePostFlushJob, queuePreFlushJob } from '../scheduler/index.js'
import { bindDebuggerOptions, type DebuggerOptions } from './debug.js'
import { clearEffectLinks, hasLinkedSignal } from './dep.js'
import { trackEffectDeps } from './track.js'

export interface RunEffectOptions extends DebuggerOptions {
  /**
   * 调度模式
   *
   * 可选的调度模式
   * - `main`：主任务调度，晚于 `pre` 早于 `post`，视图更新使用此模式进行调度，业务层副作用谨慎使用！
   * - `sync`：同步调度，一但依赖的信号触发就会立即执行，没有任务去重，慎用！
   * - `pre`：前置任务调度，早于 `main` 晚于 `sync`
   * - `post`：后置任务调度，晚于 `main`
   *
   * @default 'main'
   */
  flush?: 'main' | 'sync' | 'pre' | 'post'
  /**
   * 跟踪模式
   *
   * 可选的跟踪模式
   * - `always`：总是跟踪依赖
   * - `once`：只跟踪一次依赖，如果明确依赖是稳定的则使用此模式性能更好。
   *
   * @default 'always'
   */
  track?: 'always' | 'once'
}
export type StopRunEffect = () => void
/**
 * 用于执行一个副作用函数，存在信号依赖时持续进行调度运行，直连信号系统，
 * 主要服务于框架内核副作用，如视图更新调度，业务层副作用谨慎使用！
 *
 * @warning ⚠️ 需在合适的时机主动销毁副作用，否则可能会造成内存泄露。
 * @param effect - 要执行的副作用函数
 * @param [options] - effect 选项
 * @param [options.flush = 'main'] - 调度模式
 * @param [options.track = 'always'] - 跟踪模式
 * @param [options.onTrigger] - 跟踪调试器，仅在开发模式下有效
 * @param [options.onTrack] - 触发调试器，仅在开发模式下有效
 * @returns { StopRunEffect | null } 副作用存在信号依赖则返回Stop句柄函数，否则返回 NULL
 */
export function runEffect(
  effect: () => void,
  options: RunEffectOptions = {}
): StopRunEffect | null {
  if (typeof effect !== 'function') throw new TypeError('effect is not a function')
  const { flush = 'main', track = 'always' } = options
  const runner = track === 'always' ? () => trackEffectDeps(effect, handle) : effect
  let handle: () => void
  switch (flush) {
    case 'main':
      handle = () => queueJob(runner)
      break
    case 'sync':
      handle = runner
      break
    case 'post':
      handle = () => queuePostFlushJob(runner)
      break
    case 'pre':
      handle = () => queuePreFlushJob(runner)
      break
    default:
      throw new TypeError('flush is not a valid value')
  }
  if (__DEV__) {
    bindDebuggerOptions(handle, options)
  }
  trackEffectDeps(effect, handle)
  return hasLinkedSignal(handle) ? () => clearEffectLinks(handle) : null
}
