import type { CompareFunction, WatchCallback, WatcherOptions } from './types.js'
import { Watcher } from './watcher.js'

/**
 * ValueWatcher 值观察器抽象类
 *
 * 该类继承自 Watcher，用于观察值的变化并在值发生变化时执行回调函数。
 * 它会自动追踪 getter 函数的依赖，并在依赖的响应式数据发生变化时重新收集依赖。
 * 当检测到依赖变化时（通过 compare 函数比较，默认使用 Object.is），会触发注册的回调函数。
 *
 * @template T - 被观察值的类型
 */
export abstract class ValueWatcher<T> extends Watcher {
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
  runCallback(oldValue: T): void {
    try {
      this.callback(this._value, oldValue, this.onCleanup)
    } catch (e) {
      this.reportError(e, 'callback')
    }
  }
  /**
   * 依赖变化时执行的方法
   */
  protected override runEffect(): void {
    // 获取当前值：getter 异常时不再污染 _value（原 getter 实现吞错返回 undefined as T），
    // 仅 reportError 后返回，下次依赖变化时 getter 恢复正常再赋值并触发回调。
    let newValue: T
    try {
      newValue = this.getter()
    } catch (e) {
      this.reportError(e, 'getter')
      return
    }
    const oldValue = this._value
    // 值未变化时直接返回：不执行 cleanup、不触发 callback，
    // 避免释放上一次回调注册的资源却因回调未执行而无法重新注册（cleanup 时机修复）。
    if (this.compare(newValue, oldValue)) return
    this._value = newValue
    // 值变化时先执行 cleanup（释放上一次回调注册的资源），再触发新回调重新注册资源，
    // 保证 cleanup 与 callback 严格配对。
    this.runCleanup()
    this.runCallback(oldValue)
  }
  /**
   * 获取新值
   */
  protected abstract getter(): T
}
