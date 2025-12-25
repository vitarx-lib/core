import { collectSignal } from '../core/index.js'
import type { WatchCallback } from './types.js'
import { ValueChangeWatcher } from './ValueChangeWatcher.js'
import { type WatcherOptions } from './Watcher.js'

/**
 * ValueWatcher 值观察器类
 *
 * 该类继承自 ValueChangeWatcher，用于观察 getter 函数返回值的变化并在值发生变化时执行回调函数。
 * 它会自动追踪 getter 函数的依赖，并在依赖的响应式数据发生变化时重新收集依赖。
 * 当检测到依赖变化时（通过 compare 函数比较，默认使用 Object.is），会触发注册的回调函数。
 *
 * @template T - 被观察值的类型
 *
 * @example
 * ```typescript
 * const watcher = new ValueWatcher(
 *   () => state.value,
 *   (newValue, oldValue) => {
 *     console.log(`值从 ${oldValue} 变为 ${newValue}`)
 *   }
 * )
 * ```
 */
export class ValueWatcher<T> extends ValueChangeWatcher<T> {
  /**
   * ValueWatcher 类的构造函数
   *
   * @param _getter - 获取被观察值的函数
   * @param callback - 值发生变化时执行的回调函数
   * @param options - 可选的观察器配置选项
   */
  constructor(
    private _getter: () => T,
    callback: WatchCallback<T>,
    options: WatcherOptions
  ) {
    super(callback, options)
    this._value = this.getter()
  }
  /**
   * 获取值并收集新依赖
   *
   * 执行 getter 函数并收集其中的响应式依赖
   *
   * @returns {T} 返回类型为泛型T的值
   */
  protected override getter(): T {
    try {
      return collectSignal(this._getter, this) // 收集信号并返回结果
    } catch (e) {
      this.reportError(e, 'getter')
      return undefined as T
    }
  }
}
