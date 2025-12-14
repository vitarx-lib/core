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
 * 依赖收集副作用类
 *
 * 这是一个观察者类，继承自 Watcher 抽象基类，用于管理响应式依赖收集和副作用执行。
 * 该类实现监听副作用函数的依赖关系，依赖变化时自动执行副作用。
 *
 * @template T - getter返回值类型
 * @extends Watcher
 *
 * @example
 * ```typescript
 * class MyWatcher extends EffectWatcher {
 *   private _value = undefined
 *   constructor(signal,private cb){
 *     super(()=>readSignal(signal))
 *   }
 *   afterCollect(newValue) {
 *     if (!this.isInitialized) {
 *       this._value = newValue
 *     }else{
 *      const oldValue = this._value
 *      this._value = newValue
 *      this.cb(newValue,oldValue)
 *     }
 *   }
 * }
 * ```
 */
export class EffectWatcher<T = any> extends Watcher {
  protected readonly isInitialized: boolean = false
  constructor(
    private getter: (onCleanup: WatcherOnCleanup) => T,
    options?: EffectWatcherOptions
  ) {
    super(options)
    this.runEffect()
    this.isInitialized = true
  }
  /**
   * 子类可覆写：每一次收集完成后
   * @param value - 副作用函数返回的值
   * @protected
   */
  protected afterCollect?(value: T): void
  /**
   * 核心：执行 + 依赖收集
   *
   * 子类应该实现抽象方法：afterCollect，不要从写此方法
   *
   * @protected
   */
  protected run(): void {
    const oldErrorSource = this.errorSource
    try {
      this.errorSource = 'getter'
      const value = collectSignal(() => this.getter(this.onCleanup), this).result
      this.afterCollect?.(value)
    } finally {
      this.errorSource = oldErrorSource
    }
  }
  protected override afterDispose() {
    super.afterDispose()
    this.getter = undefined as any
  }
}
