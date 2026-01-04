import { createDepLink, peekSignal } from '../core/index.js'
import { triggerOnTrack } from '../core/signal/debug.js'
import type { RefSignal } from '../signals/index.js'
import type { WatchCallback } from './types.js'
import { ValueWatcher } from './value.js'
import { type WatcherOptions } from './watcher.js'

/**
 * RefSignalWatcher 是一个用于监听 RefSignal 值变化的观察者类。
 * 它继承自 Watcher，当监听的 RefSignal 值发生变化时执行回调函数。
 *
 * @example
 * ```typescript
 * const signal = ref(0)
 * const watcher = new RefSignalWatcher(signal, (newValue, oldValue) => {
 *   console.log(`Value changed from ${oldValue} to ${newValue}`)
 * })
 * ```
 *
 * @template T - 监听的 Signal 值的类型
 * @param signal - 要监听的 Signal 实例
 * @param cb - 值变化时的回调函数，接收三个参数：新值、旧值和清理注册函数
 * @param {WatcherOptions} [options] - 可选的观察器配置项
 */
export class RefSignalWatcher<T> extends ValueWatcher<T> {
  constructor(
    private sig: RefSignal<T>,
    cb: WatchCallback<T>,
    options?: WatcherOptions
  ) {
    super(cb, options)
    this._value = this.sig.value
    createDepLink(this.effectHandle, sig)
    if (__DEV__) {
      triggerOnTrack({
        effect: this.effectHandle,
        signal: sig,
        type: 'get'
      })
    }
  }
  /**
   * @inheritDoc
   */
  protected override getter(): T {
    return peekSignal(this.sig, 'value')
  }
}
