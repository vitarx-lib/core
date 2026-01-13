import { isFunction } from '@vitarx/utils'
import { trackEffectDeps } from '../core/index.js'
import type { WatcherOnCleanup } from './types.js'
import { Watcher, type WatcherOptions } from './watcher.js'

/**
 * 副作用观察器
 *
 * 这是一个观察者类，继承自 Watcher 抽象基类，用于管理响应式依赖收集和副作用执行。
 * 该类实现监听副作用函数的依赖关系，依赖变化时自动执行副作用。
 *
 * @template T - getter返回值类型
 * @extends Watcher
 *
 * @example
 * ```typescript
 * new EffectWatcher(() => {
 *   const count = signal(1)
 *   console.log(count())
 * })
 * ```
 */
export class EffectWatcher<T = any> extends Watcher {
  // 建议添加 readonly 修饰符
  private readonly effect: (onCleanup: WatcherOnCleanup) => T
  constructor(effect: (onCleanup: WatcherOnCleanup) => T, options?: WatcherOptions) {
    super(options)
    if (!isFunction(effect)) {
      throw new Error('[EffectWatcher] effect must be a function')
    }
    this.effect = effect
    this.runEffect()
  }
  /**
   * 核心：执行 + 依赖收集
   *
   * @protected
   */
  protected runEffect(): void {
    try {
      trackEffectDeps(() => this.effect(this.onCleanup), this.effectHandle)
    } catch (e) {
      this.reportError(e, 'effect')
    }
  }
}

/**
 * 创建一个副作用效果观察器
 *
 * 当依赖的响应式数据变化时自动执行副作用
 *
 * @param effect - 一个回调函数，接收一个 onCleanup 函数作为参数，用于清理副作用
 * @param [options] - 可选配置项，用于控制观察器的行为
 * @param [options.flush = 'pre'] - 调度模式
 * @param [options.onTrigger] - 调试钩子，在依赖发生变化时触发
 * @param [options.onTrack] - 调试钩子，在跟踪依赖时触发
 *
 * @returns {EffectWatcher} 返回一个 EffectWatcher 实例，可以用于手动停止观察
 */
export function watchEffect(
  effect: (onCleanup: WatcherOnCleanup) => void,
  options?: WatcherOptions
): EffectWatcher {
  // 返回一个观察器实例
  return new EffectWatcher(effect, options)
}
