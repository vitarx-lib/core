import type { ChangeCallback } from '../types/index.js'
import { ReactiveWatcher } from './ReactiveWatcher.js'
import type { WatcherOptions } from './Watcher.js'

/**
 * ValueWatcher 类是一个响应式值观察器，继承自 ReactiveWatcher
 * 它用于观察返回值的变化，并在值发生变化时执行回调函数
 *
 * @template T - 被观察值的类型
 */
export class ValueWatcher<T> extends ReactiveWatcher {
  // 存储被观察的值的私有成员变量
  private _value!: T

  /**
   * ValueWatcher 类的构造函数
   *
   * @param getter - 用于获取当前值的函数
   * @param _cb - 值发生变化时执行的回调函数
   * @param options - 可选的观察器配置选项
   */
  constructor(
    getter: () => T,
    private _cb: ChangeCallback<T>,
    options?: WatcherOptions
  ) {
    super(getter, options)
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
