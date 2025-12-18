import { triggerOnTrack } from '../depend/debug.js'
import { createDepLink, peekSignal } from '../depend/index.js'
import type { AnySignal, WatchCallback } from '../types/index.js'
import { ValueChangeWatcher } from './ValueChangeWatcher.js'
import { type WatcherOptions } from './Watcher.js'

/**
 * SignalWatcher 是一个用于监听 Signal 值变化的观察者类。
 * 它继承自 Watcher，当监听的 Signal 值发生变化时执行回调函数。
 *
 * @example
 * ```typescript
 * const signal = new Signal(0)
 * const watcher = new SignalWatcher(signal, (newValue, oldValue) => {
 *   console.log(`Value changed from ${oldValue} to ${newValue}`)
 * })
 * ```
 *
 * @template T - 监听的 Signal 值的类型
 * @param signal - 要监听的 Signal 实例
 * @param cb - 值变化时的回调函数，接收三个参数：新值、旧值和清理注册函数
 * @param {WatcherOptions} [options] - 可选的观察器配置项
 */
export class SignalWatcher<T> extends ValueChangeWatcher<T> {
  constructor(
    private sig: AnySignal<T>,
    cb: WatchCallback<T>,
    options?: WatcherOptions
  ) {
    super(cb, options)
    this._value = this.getter()
    createDepLink(this, sig)
    if (__DEV__) {
      triggerOnTrack({
        effect: this,
        signal: sig,
        type: 'get'
      })
    }
  }
  /**
   * @inheritDoc
   */
  protected override getter(): T {
    return peekSignal(this.sig)
  }
}
