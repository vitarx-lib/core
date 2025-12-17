import { triggerOnTrack } from '../depend/debug.js'
import { linkSignalEffect } from '../depend/index.js'
import { readSignal } from '../signal/index.js'
import type { CompareFunction, Signal, WatchCallback } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

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
export class SignalWatcher<T> extends Watcher {
  protected override errorSource: string = 'callback'
  /**
   * 比较函数，用于比较新旧值
   *
   * 可以修改此属性，自定义比较函数
   */
  public compare: CompareFunction = Object.is
  /**
   * 存储被监听的 Signal 的值
   * @private
   */
  private _value: T

  constructor(
    private signal: Signal<T>,
    private cb: WatchCallback<T>,
    options?: WatcherOptions
  ) {
    super(options)
    this._value = readSignal(signal)
    linkSignalEffect(this, signal)
    if (__DEV__) {
      triggerOnTrack({
        effect: this,
        signal,
        type: 'get'
      })
    }
  }

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
  protected runEffect() {
    const newValue = readSignal(this.signal)
    if (this.compare(newValue, this._value)) return
    const old = this._value
    this._value = newValue
    this.cb(newValue, old, this.onCleanup)
  }
}
