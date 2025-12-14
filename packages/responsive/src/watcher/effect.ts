import { logger } from '@vitarx/utils'
import type { VoidCallback } from '@vitarx/utils/src/index.js'
import {
  collectSignal,
  DEP_LINK_HEAD,
  DEP_LINK_TAIL,
  DepLink,
  linkSignalWatcher,
  removeWatcherDeps
} from '../depend/index.js'
import { Effect, EffectScope } from '../effect/index.js'
import type { DebuggerEvent, FlushMode, OnCleanup, Watcher } from '../types/index.js'
import { queuePostFlushJob, queuePreFlushJob } from './scheduler.js'

export interface WatchEffectOptions {
  /**
   * 作用域
   *
   * @default true
   */
  scope?: EffectScope | boolean
  /**
   * 指定副作用执行时机
   *
   * - 'pre'：在主任务之前执行副作用
   * - 'post'：在主任务之后执行副作用
   * - 'sync'：同步执行副作用
   *
   * @default 'pre'
   */
  flush?: FlushMode
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
 * 响应式观察者类，用于追踪响应式数据的变化并在数据变化时执行相应的副作用。
 * 该类继承自 Effect 并实现了 Watcher 接口，提供了灵活的依赖收集和触发机制。
 *
 * 核心功能：
 * - 自动收集和追踪响应式依赖
 * - 支持自定义调度器控制副作用执行时机
 * - 提供清理机制处理副作用产生的资源
 * - 支持开发模式下的调试钩子
 *
 * 示例：
 * ```typescript
 * const watcher = new ReactiveWatcher(
 *   (onCleanup) => {
 *     // 副作用逻辑
 *     const timer = setInterval(() => console.log('tick'), 1000)
 *     onCleanup(() => clearInterval(timer))
 *   },
 *   { flush: 'pre' }
 * )
 * ```
 *
 * 构造函数参数：
 * @param getter - 副作用函数，接收 onCleanup 回调用于注册清理函数
 * @param options - 可选配置项
 *   - flush: 指定副作用执行时机 ('pre' | 'post' | 'sync')
 *   - scope: 作用域对象，用于错误处理
 *   - onTrack: 开发模式下依赖收集时的回调
 *   - onTrigger: 开发模式下触发更新时的回调
 *
 * 使用限制：
 * - 在开发模式下，onTrack 和 onTrigger 仅在 __DEV__ 为 true 时生效
 * - flush 选项若为无效值，将默认使用 'pre' 模式并发出警告
 * - 内部维护的依赖链表不应被外部直接访问或修改
 */
export class ReactiveWatcher extends Effect implements Watcher {
  /** watcher 维度链表头尾 */
  [DEP_LINK_HEAD]?: DepLink;
  [DEP_LINK_TAIL]?: DepLink

  /** 调度函数 */
  public scheduler: ((job: () => void) => void) | undefined

  /** cleanup 回调列表 */
  public readonly cleanups: VoidCallback[] = []
  onTrigger?: (event: DebuggerEvent) => void
  onTrack?: (event: DebuggerEvent) => void

  constructor(
    private effect: (onCleanup: OnCleanup) => void,
    options?: WatchEffectOptions
  ) {
    super(options?.scope)
    if (__DEV__) {
      this.onTrigger = options?.onTrigger
      this.onTrack = options?.onTrack
    }
    if (options?.flush && options.flush !== 'sync') {
      switch (options.flush) {
        case 'pre':
          this.scheduler = queuePreFlushJob
          break
        case 'post':
          this.scheduler = queuePostFlushJob
          break
        default:
          logger.warn(`[ReactiveWatcher] Invalid flush option: ${options.flush}`)
          this.scheduler = queuePreFlushJob
      }
    }
    this.collect()
  }

  /**
   * 触发方法，根据活动状态和调度器情况执行收集操作
   * 如果当前组件处于非活动状态，则直接返回
   */
  trigger() {
    // 检查当前是否处于活动状态，如果不是则直接返回
    if (!this.isActive) return

    // 判断是否有调度器
    if (this.scheduler) {
      // 如果有调度器，则将收集函数作为回调传递给调度器
      this.scheduler(this.collect)
    } else {
      // 如果没有调度器，则直接执行收集函数
      this.collect()
    }
  }

  /**
   * 清理方法，用于执行所有注册的清理函数
   * 该方法会遍历并执行所有清理函数，并在执行过程中处理可能出现的错误
   */
  public cleanup() {
    // 遍历所有注册的清理函数
    for (const cleanupFn of this.cleanups) {
      try {
        // 尝试执行当前清理函数
        cleanupFn()
      } catch (e) {
        // 如果执行过程中出现错误
        if (this._scope) {
          // 如果存在作用域，则使用作用域处理错误
          this._scope.handleError(e, 'watcher.cleanup')
        } else {
          // 如果不存在作用域，则重新抛出错误
          throw e
        }
      }
    }
    // 清空清理函数数组
    this.cleanups.length = 0
  }

  /**
   * 重写销毁前的处理方法
   * 在对象被销毁前执行必要的清理工作
   */
  protected override beforeDispose() {
    // 调用清理方法，释放资源
    this.cleanup()
  }

  /**
   * 在对象被销毁后执行的清理方法
   * 重写父类的afterDispose方法，用于释放资源
   */
  protected override afterDispose() {
    // 将调度器引用置为undefined，帮助垃圾回收
    this.scheduler = undefined
    // 将触发回调函数置为undefined，清除引用
    this.onTrigger = undefined
    // 将追踪回调函数置为undefined，清除引用
    this.onTrack = undefined
    // 从依赖项中移除当前watcher实例
    removeWatcherDeps(this)
  }

  /**
   * 收集依赖
   */
  private collect = () => {
    this.cleanup()
    removeWatcherDeps(this)
    try {
      collectSignal(() => this.effect(this.cleanups.push.bind(this.cleanups)), {
        add: signal => linkSignalWatcher(this, signal),
        onTrack: this.onTrack
      })
    } catch (e) {
      if (this._scope) {
        this._scope.handleError(e, 'watcher.getter')
      } else {
        throw e
      }
    }
  }
}
/**
 * 创建一个响应式的副作用函数，
 * 当依赖的响应式数据变化时自动重新运行
 *
 * @param effect - 一个接收 onCleanup 函数作为参数的函数，用于定义副作用逻辑
 * @param options - 可选的配置对象，用于控制副作用的行为
 * @returns {ReactiveWatcher} 返回一个 ReactiveWatcher 实例，可以用来停止监听或获取相关信息
 */
export function watchEffect(
  effect: (onCleanup: OnCleanup) => void,
  options?: WatchEffectOptions
): ReactiveWatcher {
  return new ReactiveWatcher(effect, options) // 创建并返回一个新的 ReactiveWatcher 实例
}
