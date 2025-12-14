import { collectSignal } from '../depend/index.js'
import type { WatcherOnCleanup, WatcherOptions } from '../types/index.js'
import { Watcher } from './Watcher.js'

/**
 * EffectWatcher 观察器配置选项接口
 *
 * 该接口扩展了 WatcherOptions。
 *
 * @extends WatcherOptions
 */
export interface EffectWatcherOptions extends WatcherOptions {}
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
  protected override errorSource: string = 'collect'
  constructor(
    private effect: (onCleanup: WatcherOnCleanup) => T,
    options?: EffectWatcherOptions
  ) {
    super(options)
    this.runEffect()
  }
  /**
   * 核心：执行 + 依赖收集
   *
   * 子类应该实现抽象方法：afterCollect，不要从写此方法
   *
   * @protected
   */
  protected run(): void {
    collectSignal(() => this.effect(this.onCleanup), this)
  }
  protected override afterDispose() {
    super.afterDispose()
    this.effect = undefined as any
  }
}
