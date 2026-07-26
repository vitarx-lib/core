import { trackEffect } from '../core/index.js'
import type { WatchCallback } from './types.js'
import { ValueWatcher } from './value.js'
import { type WatcherOptions } from './watcher.js'

/**
 * GetterWatcher getter 观察器类
 *
 * 该类继承自抽象类 ValueWatcher，是 ValueWatcher 的具体实现。
 * 通过传入一个 getter 函数来获取被观察的值，并利用 trackEffect 自动追踪 getter 内部访问的响应式依赖。
 * 当依赖的响应式数据发生变化时，会重新执行 getter 收集新依赖，并通过父类提供的 compare 函数比较新旧值，
 * 若值发生变化则触发注册的回调函数。
 *
 * @template T - 被观察值的类型
 *
 * @example
 * ```typescript
 * const watcher = new GetterWatcher(
 *   () => state.value,
 *   (newValue, oldValue) => {
 *     console.log(`值从 ${oldValue} 变为 ${newValue}`)
 *   },
 *   { flush: 'pre' }
 * )
 * ```
 */
export class GetterWatcher<T> extends ValueWatcher<T> {
  /**
   * GetterWatcher 类的构造函数
   *
   * @param _getter - 获取被观察值的函数，其内部访问的响应式数据会被自动追踪
   * @param callback - 值发生变化时执行的回调函数
   * @param options - 观察器配置选项
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
      return trackEffect(this._getter, this.effectHandle) // 收集信号并返回结果
    } catch (e) {
      this.reportError(e, 'getter')
      return undefined as T
    }
  }
}
