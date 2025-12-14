import type { ChangeCallback, WatcherOnCleanup, WatchOptions } from '../types/index.js'
import { EffectWatcher } from './EffectWatcher.js'

/**
 * ValueWatcher 观察器配置选项接口
 *
 * 该接口扩展了 WatchOptions。
 *
 * @extends WatchOptions
 */
export interface ValueWatcherOptions extends WatchOptions {}

/**
 * ValueWatcher 值观察器类
 *
 * 该类继承自 EffectWatcher，用于观察值的变化并在值发生变化时执行回调函数。
 * 它会自动追踪依赖，并在依赖的响应式数据发生变化时重新收集依赖。
 * 当检测到值变化时（通过 Object.is 比较），会触发注册的回调函数。
 *
 * @template T - 被观察值的类型
 *
 * @example
 * ```typescript
 * const watcher = new ValueWatcher(
 *   () => state.value,
 *   (newValue, oldValue) => {
 *     console.log(`值从 ${oldValue} 变为 ${newValue}`)
 *   },
 *   { immediate: true }
 * )
 * ```
 */
export class ValueWatcher<T> extends EffectWatcher<T> {
  /**
   * 存储被观察的值的私有成员变量
   * @private
   */
  private _value!: T

  /**
   * ValueWatcher 类的构造函数
   *
   * @param getter - 用于获取当前值的函数
   * @param _cb - 值发生变化时执行的回调函数
   * @param options - 可选的观察器配置选项
   */
  constructor(
    getter: (onCleanup: WatcherOnCleanup) => T,
    private _cb: ChangeCallback<T>,
    options?: ValueWatcherOptions
  ) {
    super(getter, options)
    if (options?.immediate) {
      try {
        this._cb(this._value, this._value, this.onCleanup)
      } catch (e) {
        this.reportError(e, 'callback')
      }
    }
  }

  /**
   * 在收集依赖后执行的操作
   * 比较新旧值的变化，如果有变化则调用回调函数
   * @param value - 当前值
   */
  protected override afterCollect(value: T) {
    // 如果是第一次初始化，直接设置值并返回
    if (!this.isInitialized) {
      this._value = value
      return
    }

    // 使用 Object.is 比较新旧值，如果相同则直接返回
    if (Object.is(value, this._value)) return

    // 保存旧值，更新新值，并调用回调函数
    const old = this._value
    this._value = value
    this.errorSource = 'callback'
    this._cb(value, old, this.onCleanup)
  }
  /**
   * 在观察器被销毁时执行的操作
   * 清除回调函数引用，并调用父类的销毁方法
   */
  protected override afterDispose() {
    super.afterDispose()
    this._cb = undefined as any
    this._value = undefined as any
  }
}
