import type { CompareFunction, WatchCallback } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * ValueChangeWatcher 值观察器类
 *
 * 该类继承自 Watcher，用于观察 getter 函数返回值的变化并在值发生变化时执行回调函数。
 * 它会自动追踪 getter 函数的依赖，并在依赖的响应式数据发生变化时重新收集依赖。
 * 当检测到依赖变化时（通过 compare 函数比较，默认使用 Object.is），会触发注册的回调函数。
 *
 * @template T - 被观察值的类型
 *
 * @example
 * ```typescript
 * const watcher = new ValueChangeWatcher(
 *   () => state.value,
 *   (newValue, oldValue) => {
 *     console.log(`值从 ${oldValue} 变为 ${newValue}`)
 *   }
 * )
 * ```
 */
export abstract class ValueChangeWatcher<T> extends Watcher {
  /**
   * 比较函数，用于比较新旧值
   *
   * 默认使用 Object.is 进行比较，可以修改此属性来自定义比较函数
   */
  public compare: CompareFunction = Object.is
  /**
   * ValueWatcher 类的构造函数
   *
   * @param callback - 值发生变化时执行的回调函数
   * @param options - 可选的观察器配置选项
   */
  protected constructor(
    private callback: WatchCallback<T>,
    options?: WatcherOptions
  ) {
    super(options)
  }
  protected _value!: T
  public get value(): T {
    return this._value
  }
  /**
   * 运行回调函数
   *
   * @param oldValue - 旧值
   */
  runCallback(oldValue: T) {
    try {
      this.callback(this._value, oldValue, this.onCleanup)
    } catch (e) {
      this.reportError(e, 'callback')
    }
  }
  /**
   * 依赖变化时执行的方法
   */
  protected override runEffect() {
    // 获取当前值
    const newValue = this.getter()
    // 使用 compare 函数比较新旧值，如果相同则直接返回
    if (this.compare(newValue, this._value)) return
    // 保存旧值，更新新值，并调用回调函数
    const oldValue = this._value
    this._value = newValue
    // 调用回调函数，传入新值、旧值和清理函数
    this.runCallback(oldValue)
  }
  /**
   * 获取新值
   */
  protected abstract getter(): T
}
