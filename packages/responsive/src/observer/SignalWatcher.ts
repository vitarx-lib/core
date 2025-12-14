import { triggerOnTrack } from '../depend/debug.js'
import { linkSignalWatcher } from '../depend/index.js'
import { readSignal } from '../signal/index.js'
import type { ChangeCallback, Signal, WatchOptions } from '../types/index.js'
import { Watcher } from './Watcher.js'

/**
 * SignalWatcher 观察器配置选项接口
 *
 * 该接口扩展了 WatchOptions。
 *
 * @extends WatchOptions
 */
export interface SignalWatcherOptions extends WatchOptions {}
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
 * @param signal - 要监听的 Signal 实例
 * @param cb - 值变化时的回调函数，接收三个参数：新值、旧值和清理函数
 * @param options - 可选配置项
 *   - once: 是否只触发一次，默认为 false
 *   - immediate: 是否立即执行一次回调，默认为 false
 */
export class SignalWatcher<T> extends Watcher {
  protected override errorSource: string = 'callback'
  private _value!: T
  private readonly _once: boolean = false
  private readonly _init: boolean = false
  constructor(
    private signal: Signal<T>,
    private cb: ChangeCallback<T>,
    options?: SignalWatcherOptions
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
    this._once = options?.once ?? false
    if (options?.immediate) this.runEffect()
    this._init = true
  }

  /**
   * @inheritDoc
   */
  protected run() {
    const newValue = readSignal(this.signal)
    if (this._init && Object.is(newValue, this._value)) return
    const old = this._value
    this._value = newValue
    this.cb(newValue, old, this.onCleanup)
    if (this._once) this.dispose()
  }

  protected override afterDispose() {
    super.afterDispose()
    this._value = undefined as any
    this.signal = undefined as any
    this.cb = undefined as any
  }
}
