import { collectSignal, removeWatcherDeps } from '../depend/index.js'
import type { ChangeCallback } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * ValueWatcher 值观察器类
 *
 * 该类继承自 Watcher，用于观察getter返回值值的变化并在值发生变化时执行回调函数。
 * 它会自动追踪getter依赖，并在依赖的响应式数据发生变化时重新收集依赖。
 * 当检测到依赖变化时（通过 Object.is 比较），会触发注册的回调函数。
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
export class ValueWatcher<T> extends Watcher {
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
    private getter: () => T,
    private _cb: ChangeCallback<T>,
    options?: WatcherOptions
  ) {
    super(options)
    this._value = this.getValue()
  }

  /**
   * 重写运行方法，用于执行响应式值的更新逻辑
   */
  protected override run() {
    // 获取当前值
    const value = this.getValue()
    // 使用 Object.is 比较新旧值，如果相同则直接返回
    if (Object.is(value, this._value)) return
    // 保存旧值，更新新值，并调用回调函数
    const old = this._value
    this._value = value
    this.errorSource = 'callback'
    // 调用回调函数，传入新值、旧值和清理函数
    this._cb(value, old, this.onCleanup)
  }
  /**
   * 获取值并收集新依赖
   *
   * @returns {T} 返回类型为泛型T的值
   */
  private getValue(): T {
    this.errorSource = 'getter' // 设置错误源为getter
    removeWatcherDeps(this)
    return collectSignal(this.getter, this).result // 收集信号并返回结果
  }
  /**
   * 获取值的getter方法
   *
   * @returns {T} 返回存储的值，类型为泛型T
   */
  public get value(): T {
    return this._value // 返回内部存储的_value属性
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
