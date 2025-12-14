import { triggerOnTrack } from '../depend/debug.js'
import { linkSignalWatcher } from '../depend/index.js'
import { readSignal } from '../signal/index.js'
import type { ChangeCallback, Signal } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * SignalWatcher 是一个用于监听 Signal 值变化的观察者类。
 * 它继承自 Watcher，当监听的 Signal 值发生变化时执行回调函数。
 *
 * 核心功能：
 * - 监听 Signal 值的变化
 * - 支持一次性监听（once 模式）
 * - 支持立即执行回调（immediate 模式）
 * - 自动清理资源
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
 * @param cb - 值变化时的回调函数，接收三个参数：新值、旧值和清理函数
 * @param {WatcherOptions} options - 可选的观察器配置项
 */
export class SignalWatcher<T> extends Watcher {
  protected override errorSource: string = 'callback'
  constructor(
    private signal: Signal<T>,
    private cb: ChangeCallback<T>,
    options?: WatcherOptions
  ) {
    super(options)
    this._value = readSignal(signal)
    linkSignalWatcher(this, signal)
    if (__DEV__) {
      triggerOnTrack({
        watcher: this,
        signal,
        type: 'get'
      })
    }
  }

  /**
   * 存储被监听的 Signal 的值
   * @private
   */
  private _value: T

  /**
   * 获取值的getter方法
   * 用于返回当前实例中存储的信号值
   *
   * @returns {T} 返回泛型类型T的值
   */
  public get value(): T {
    return this._value
  }
  /**
   * @inheritDoc
   */
  protected run() {
    const newValue = readSignal(this.signal)
    if (Object.is(newValue, this._value)) return
    const old = this._value
    this._value = newValue
    this.cb(newValue, old, this.onCleanup)
  }
}
