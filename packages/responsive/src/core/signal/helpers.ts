import { queueJob } from '../scheduler/index.js'
import { bindDebuggerOptions, type DebuggerOptions } from './debug.js'
import { clearEffectLinks, hasLinkedSignal } from './dep.js'
import { trackEffectDeps } from './track.js'

export interface RunEffectOptions extends DebuggerOptions {
  /**
   * 调度模式
   *
   * 可选的调度模式
   * - `main`：主任务队列执行，晚于 `pre` 早于 `post`
   * - `sync`：同步执行
   *
   * @default 'main'
   */
  flush?: 'main' | 'sync'
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
 * 运行时一个副作用函数
 *
 * @param effect - 要执行的副作用函数
 * @param [options] - effect 选项
 * @param [options.flush = 'main'] - 调度模式
 * @param [options.track = 'always'] - 跟踪模式
 * @param [options.onTrigger] - 跟踪调试器，仅在开发模式下有效
 * @param [options.onTrack] - 触发调试器，仅在开发模式下有效
 * @returns { StopRunEffect | undefined } 停止运行的函数
 */
export function runEffect(
  effect: () => void,
  options: RunEffectOptions = {}
): StopRunEffect | undefined {
  if (typeof effect !== 'function') throw new TypeError('effect is not a function')
  const { flush = 'main', track = 'always' } = options
  const runner = track === 'always' ? () => trackEffectDeps(effect, handle) : effect
  const handle = flush === 'main' ? () => queueJob(runner) : runner
  if (__DEV__) {
    bindDebuggerOptions(handle, options)
  }
  trackEffectDeps(effect, handle)
  return hasLinkedSignal(handle) ? () => clearEffectLinks(handle) : void 0
}
