import type { VoidCallback } from '@vitarx/utils/src/index.js'
import { collectSignal } from '../depend/index.js'
import type { OnCleanup } from '../types/index.js'
import { Watcher, type WatcherOptions } from './Watcher.js'

/**
 * 依赖收集副作用类
 *
 * 这是一个观察者类，继承自 Watcher 抽象基类，用于管理响应式依赖收集和副作用执行。
 * 该类实现监听副作用函数的依赖关系，依赖变化时自动执行副作用。
 *
 * @extends Watcher
 *
 * @example
 * ```typescript
 * class MyEffect extends DepEffect {
 *   protected getter(onCleanup: OnCleanup) {
 *     // 实现具体的 getter 逻辑
 *     return someReactiveValue.value
 *   }
 *
 *   trigger() {
 *     // 实现触发逻辑
 *     this.collect()
 *   }
 * }
 * ```
 */
export class ReactiveWatcher<T = any> extends Watcher {
  /** cleanup 回调 */
  protected readonly cleanups: VoidCallback[] = []
  constructor(
    private effect: (onCleanup: OnCleanup) => T,
    options?: WatcherOptions
  ) {
    super(options)
    this.run()
  }

  /**
   * 子类可覆写：每一次收集完成后
   * @param value - 副作用函数返回的值
   * @protected
   */
  protected afterCollect?(value: T): void

  /**
   * 在对象被销毁前执行清理操作
   * 这是一个重写的方法，用于在组件或实例被销毁前执行必要的清理工作
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  protected override beforeDispose() {
    // 调用清理方法，执行资源释放等清理操作
    this.cleanup()
    super.beforeDispose()
  }

  /** 核心：执行 + 依赖收集 */
  protected run(): void {
    this.cleanup()
    let value: any
    try {
      value = collectSignal(() => this.effect(this.cleanups.push.bind(this.cleanups)), this).result
    } catch (e) {
      if (this._scope) {
        this._scope.handleError(e, 'collect')
      } else {
        throw e
      }
    }
    this.afterCollect?.(value)
  }

  /**
   * 清理方法，用于执行所有注册的清理函数并清空清理函数列表
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  private cleanup(): void {
    // 遍历并执行所有注册的清理函数
    for (const fn of this.cleanups) fn()
    // 清空清理函数列表，将数组长度设置为0
    this.cleanups.length = 0
  }
}
