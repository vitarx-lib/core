import { collectSignal } from '../depend/index.js'
import type { CompareFunction, WatchCallback } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * ValueWatcher 值观察器类
 *
 * 该类继承自 Watcher，用于观察 getter 函数返回值的变化并在值发生变化时执行回调函数。
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
 *   },
 *   { immediate: true }
 * )
 * ```
 */
export class ValueWatcher<T> extends Watcher {
  /**
   * 比较函数，用于比较新旧值
   *
   * 默认使用 Object.is 进行比较，可以修改此属性来自定义比较函数
   */
  public compare: CompareFunction = Object.is

  /**
   * ValueWatcher 类的构造函数
   *
   * @param getter - 用于获取当前值的函数
   * @param callback - 值发生变化时执行的回调函数
   * @param options - 可选的观察器配置选项
   */
  constructor(
    private getter: () => T,
    private callback: WatchCallback<T>,
    options?: WatcherOptions
  ) {
    super(options)
    this._value = this.getValue()
  }

  /**
   * 存储被观察的值
   * @private
   */
  private _value!: T

  /**
   * 获取当前观察的值
   *
   * @returns {T} 返回存储的值，类型为泛型T
   */
  public get value(): T {
    return this._value
  }

  /**
   * 重写运行方法，用于执行响应式值的更新逻辑
   *
   * 此方法会在依赖的响应式数据发生变化时被调用
   */
  protected override runEffect() {
    // 获取当前值
    const newValue = this.getValue()

    // 使用 compare 函数比较新旧值，如果相同则直接返回
    if (this.compare(newValue, this._value)) return

    // 保存旧值，更新新值，并调用回调函数
    const oldValue = this._value
    this._value = newValue
    this.errorSource = 'callback'

    // 调用回调函数，传入新值、旧值和清理函数
    this.callback(newValue, oldValue, this.onCleanup)
  }

  /**
   * 获取值并收集新依赖
   *
   * 执行 getter 函数并收集其中的响应式依赖
   *
   * @returns {T} 返回类型为泛型T的值
   */
  private getValue(): T {
    this.errorSource = 'getter' // 设置错误源为getter
    return collectSignal(this.getter, this).result // 收集信号并返回结果
  }
}
