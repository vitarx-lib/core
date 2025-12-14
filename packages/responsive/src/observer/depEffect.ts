import type { VoidCallback } from '@vitarx/utils/src/index.js'
import {
  collectSignal,
  DEP_LINK_HEAD,
  DEP_LINK_TAIL,
  DepLink,
  removeWatcherDeps
} from '../depend/index.js'
import { Effect, type EffectOptions } from '../effect/index.js'
import type { DebuggerEvent, OnCleanup, Watcher } from '../types/index.js'

export interface DepEffectOptions extends EffectOptions {
  /**
   * 追踪依赖的调试钩子
   */
  onTrack?: (event: DebuggerEvent) => void
  /**
   * 触发更新时的调试钩子
   */
  onTrigger?: (event: DebuggerEvent) => void
}
/**
 * 依赖收集副作用抽象类
 *
 * 这是一个抽象基类，继承自 Effect 并实现了 Watcher 接口，用于管理响应式依赖收集和副作用执行。
 * 该类提供了依赖收集、清理和触发机制的核心实现，子类需要实现具体的 getter 和 trigger 方法。
 *
 * @abstract
 * @extends Effect
 * @implements Watcher
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
export abstract class DepEffect extends Effect implements Watcher {
  /** watcher 维度依赖链表 */
  [DEP_LINK_HEAD]?: DepLink;
  [DEP_LINK_TAIL]?: DepLink
  onTrigger?: (event: DebuggerEvent) => void
  onTrack?: (event: DebuggerEvent) => void
  /** cleanup 回调 */
  protected readonly cleanups: VoidCallback[] = []
  protected constructor(options: DepEffectOptions) {
    super(options)
    if (__DEV__) {
      this.onTrigger = options?.onTrigger
      this.onTrack = options?.onTrack
    }
  }
  abstract trigger(): void

  /** 子类必须提供 getter */
  protected abstract getter(onCleanup: OnCleanup): any

  /** 子类可覆写：收集完成后 */
  protected afterCollect?(value: any): void

  /** 核心：执行 + 依赖收集 */
  protected collect(): any {
    this.cleanup()
    let value: any
    try {
      value = collectSignal(() => this.getter(this.cleanups.push.bind(this.cleanups)), this).result
    } catch (e) {
      if (this._scope) {
        this._scope.handleError(e, 'collect')
      } else {
        throw e
      }
    }

    this.afterCollect?.(value)
    return value
  }

  /**
   * 清理方法，用于执行所有注册的清理函数并清空清理函数列表
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  protected cleanup() {
    // 遍历并执行所有注册的清理函数
    for (const fn of this.cleanups) fn()
    // 清空清理函数列表，将数组长度设置为0
    this.cleanups.length = 0
  }

  /**
   * 在对象被销毁前执行清理操作
   * 这是一个重写的方法，用于在组件或实例被销毁前执行必要的清理工作
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  protected override beforeDispose() {
    // 调用清理方法，执行资源释放等清理操作
    this.cleanup()
    // 移除所有相关的依赖观察者，防止内存泄漏
    removeWatcherDeps(this)
  }
}
