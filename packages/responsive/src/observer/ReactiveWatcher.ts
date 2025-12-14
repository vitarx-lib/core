import { collectSignal } from '../depend/index.js'
import type { OnCleanup } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * 依赖收集副作用类
 *
 * 这是一个观察者类，继承自 Watcher 抽象基类，用于管理响应式依赖收集和副作用执行。
 * 该类实现监听副作用函数的依赖关系，依赖变化时自动执行副作用。
 *
 * @extends Watcher
 *
 * @example
 * ```typescript
 * class MyWatcher extends ReactiveWatcher {
 *   private init = false
 *   private _value = undefined
 *   constructor(signal,private cb){
 *     super(()=>readSignal(signal))
 *   }
 *   afterCollect(newValue) {
 *     if (!this.init) {
 *       this.init = true
 *       this._value = newValue
 *     }else{
 *      this.cb(newValue,this._value)
 *      this._value = newValue
 *     }
 *   }
 * }
 * ```
 */
export class ReactiveWatcher<T = any> extends Watcher {
  constructor(
    private getter: (onCleanup: OnCleanup) => T,
    options?: WatcherOptions
  ) {
    super(options)
    this.runEffect()
  }
  /**
   * 子类可覆写：每一次收集完成后
   * @param value - 副作用函数返回的值
   * @protected
   */
  protected afterCollect?(value: T): void
  /** 核心：执行 + 依赖收集 */
  protected run(): void {
    this.errorSource = 'getter'
    const value = collectSignal(() => this.getter(this.onCleanup), this).result
    this.errorSource = 'trigger'
    this.afterCollect?.(value)
  }
}
