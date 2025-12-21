import type { VoidCallback } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import { clearEffectDeps, type DepEffectLike } from '../depend/index.js'
import { Effect, type EffectOptions } from '../effect/index.js'
import type { DebuggerHandler, FlushMode } from '../types/index.js'
import { queuePostFlushJob, queuePreFlushJob, type Scheduler } from './scheduler.js'

/**
 * 观察器配置选项接口
 *
 * 该接口扩展了 EffectOptions，提供了专门用于观察器的额外配置选项。
 *
 * @property {DebuggerHandler} [onTrigger] - trigger 调试钩子
 * @property {DebuggerHandler} [onTrack] - track 调试钩子
 * @property {FlushMode} [flush='pre'] - 指定副作用执行时机
 * @property {boolean|EffectScope} [scope=true] - 作用域
 */
export interface WatcherOptions extends EffectOptions {
  /** trigger 调试钩子 */
  onTrigger?: DebuggerHandler
  /** track 调试钩子 */
  onTrack?: DebuggerHandler
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
}

/**
 * Watcher 抽象基类
 * - 实现 DepEffect 接口的公共部分
 * - 初始化调试钩子
 * - 初始化调度器
 * - 实现调度逻辑
 * - 抽象 runEffect 方法由子类实现
 * - 实现 beforeDispose 和 afterDispose，清理资源
 *
 * 注意事项：
 * - 子类如重写了 beforeDispose / afterDispose，必须调用 super.beforeDispose / afterDispose 来清理资源。
 * - 子类必须实现 runEffect 方法，用于执行副作用，不需要重复添加 try-catch。
 * - 子类不应该调用 runEffect 方法，如需主动执行可调用 execute 方法。（无异步调度）
 * - run 方法是提供给信号系统使用的，非必要不要主动调用此方法。（有异步调度）
 * - 子类应该需要使用 collectSignal / linkSignalWatcher 助手函数来绑定依赖关系。（销毁时会自动解绑）
 *
 * @abstract
 * @implements DepEffectLike
 */
export abstract class Watcher extends Effect implements DepEffectLike {
  /** trigger 调试钩子 */
  onTrigger?: DebuggerHandler
  /** track 调试钩子 */
  onTrack?: DebuggerHandler
  /**
   * 静态缓存 scheduler 对象，用于存储不同 flush 模式对应的调度器实例。
   *
   * @private
   */
  private static readonly schedulerMap: Record<FlushMode, Scheduler> = {
    pre: queuePreFlushJob,
    post: queuePostFlushJob,
    sync: (job: () => void) => job()
  }
  /**
   * 调度器
   *
   * 可以修改，但不建议运行时动态修改。
   *
   * @default `queuePreFlushJob`
   */
  public scheduler: Scheduler
  /** cleanup 回调 */
  private readonly cleanups: VoidCallback[] = []

  /**
   * 构造函数
   * @param options 调试钩子选项
   */
  constructor(options: WatcherOptions = {}) {
    const { flush = 'pre', ...effectOptions } = options
    super(effectOptions)
    if (__DEV__) {
      this.onTrigger = options.onTrigger
      this.onTrack = options.onTrack
    }
    const scheduler = Watcher.schedulerMap[flush]
    if (!scheduler) {
      logger.warn(`[Watcher] Invalid flush option: ${flush}`)
      this.scheduler = queuePreFlushJob
    } else {
      this.scheduler = scheduler
    }
  }
  /**
   * 添加清理函数
   *
   * @param cleanupFn - 清理函数
   * @throws {TypeError} 如果清理函数不是函数类型，则抛出一个类型错误
   */
  public onCleanup = (cleanupFn: VoidCallback): void => {
    if (typeof cleanupFn !== 'function') {
      throw new TypeError('[onWatcherCleanup] Invalid cleanup function.')
    }
    this.cleanups.push(cleanupFn)
  }
  /**
   * 响应 signal 变化或触发回调
   *
   * 此方法是由信号触发器调用的，子类需实现抽象runEffect方法。
   */
  run(): void {
    if (!this.isActive) return
    this.scheduler(this.execute)
  }
  /**
   * 执行副作用
   *
   * 立即执行副作用函数，包含错误处理和清理工作。
   * 与 schedule() 不同，此方法会同步执行，不经过调度器。
   */
  execute = (): void => {
    if (!this.isActive) return
    this.runCleanup()
    this.runEffect()
  }
  /**
   * 在对象被销毁后执行的清理方法
   * 重写父类的afterDispose方法，用于释放资源
   */
  protected override afterDispose() {
    // 将触发回调函数置为undefined，清除引用
    this.onTrigger = undefined
    // 将追踪回调函数置为undefined，清除引用
    this.onTrack = undefined
  }
  /**
   * 在对象被销毁前执行清理操作
   * 这是一个重写的方法，用于在组件或实例被销毁前执行必要的清理工作
   *
   * @protected
   */
  protected override beforeDispose() {
    // 调用清理方法，执行资源释放等清理操作
    this.runCleanup()
    // 移除所有相关的依赖观察者，防止内存泄漏
    clearEffectDeps(this)
  }
  /**
   * 执行副作用逻辑
   *
   * 抽象方法，由子类实现具体的副作用逻辑。
   *
   * @warning 子类不应直接调用此方法，而应使用：
   * - execute() - 同步执行副作用
   * - schedule() - 通过调度器执行副作用（可能异步）
   *
   * @abstract
   * @protected
   */
  protected abstract runEffect(): void
  /**
   * 报告观察器相关的错误
   *
   * 重写父类的错误报告方法，在错误来源前添加 'watcher.' 前缀，
   * 以便更好地追踪错误发生在观察器的哪个环节。
   *
   * @param e - 发生的错误对象
   * @param source - 错误来源标识，如 'trigger'、'getter'、'callback' 等
   * @override 重写父类的 reportError 方法
   *
   * @example
   * ```typescript
   * // 在 getter 中发生错误时
   * this.reportError(error, 'getter')  // 输出: watcher.getter
   *
   * // 在回调执行中发生错误时
   * this.reportError(error, 'callback')  // 输出: watcher.callback
   * ```
   */
  protected override reportError(e: unknown, source: string) {
    super.reportError(e, `watcher.${source}`)
  }
  /**
   * 清理方法，用于执行所有注册的清理函数并清空清理函数列表
   *
   * @internal 仅供内部使用
   * @private
   */
  protected runCleanup(): void {
    // 遍历并执行所有注册的清理函数
    for (const fn of this.cleanups) {
      try {
        fn()
      } catch (e) {
        this.reportError(e, 'cleanup')
      }
    }
    // 清空清理函数列表，将数组长度设置为0
    this.cleanups.length = 0
  }
}
