import { isFunction } from '@vitarx/utils'
import { trackEffect } from '../core/index.js'
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
      trackEffect(() => this.effect(this.onCleanup), this.effectHandle)
    } catch (e) {
      this.reportError(e, 'effect')
    }
  }
}
