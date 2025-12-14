import { linkSignalWatcher } from '../depend/index.js'
import { readSignal } from '../signal/index.js'
import type { ChangeCallback, Signal } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * SignalWatcher 观察器配置选项接口
 *
 * 该接口扩展了 WatcherOptions，提供了专门用于信号观察的额外配置选项。
 *
 * @interface SignalWatcherOptions
 * @extends WatcherOptions
 */
interface SignalWatcherOptions extends WatcherOptions {
  /**
   * 是否立即执行回调函数
   *
   * 当设置为 true 时，观察器创建后会立即执行一次回调函数，
   * 无需等待信号值发生变化。回调函数接收当前值作为新值，
   * undefined 作为旧值。
   *
   * @default false
   * @example
   * ```typescript
   * const signal = new Signal(10);
   * const watcher = new SignalWatcher(signal, (newValue, oldValue) => {
   *   console.log(`Value: ${newValue}`); // 立即输出: Value: 10
   * }, { immediate: true });
   * ```
   */
  immediate?: boolean

  /**
   * 是否只触发一次回调
   *
   * 当设置为 true 时，回调函数只会在第一次信号值变化时执行，
   * 之后观察器将自动停止并释放资源。
   *
   * @default false
   * @example
   * ```typescript
   * const signal = new Signal(0);
   * const watcher = new SignalWatcher(signal, (newValue, oldValue) => {
   *   console.log(`Changed from ${oldValue} to ${newValue}`); // 只会执行一次
   * }, { once: true,flush:'sync' });
   *
   * signal.value = 1; // 触发回调: Changed from 0 to 1
   * signal.value = 2; // 不会触发回调，因为观察器已经停止
   * ```
   */
  once?: boolean
}
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
 *
 * @throws 当 signal 或 cb 为 undefined 时可能抛出错误
 */
export class SignalWatcher<T> extends Watcher {
  protected override errorSource: string = 'callback'
  private _value: T
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
