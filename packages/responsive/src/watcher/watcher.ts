import { logger, type VoidCallback } from '@vitarx/utils'
import {
  bindDebuggerOptions,
  clearEffectLinks,
  type DebuggerHandler,
  type DebuggerOptions,
  Effect,
  type EffectHandle,
  EffectScope,
  queuePostFlushJob,
  queuePreFlushJob,
  type Scheduler
} from '../core/index.js'
import type { FlushMode } from './types.js'

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
export interface WatcherOptions extends DebuggerOptions {
  /**
   * 作用域
   *
   * - ture 表示当前效果将自动加入当前作用域。
   * - false 表示当前效果将不会加入任何作用域。
   * - EffectScope 对象 ：表示当前效果将加入指定的作用域。
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
}

/**
 * Watcher 抽象基类
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
 * @implements EffectHandle
 */
export abstract class Watcher extends Effect {
  private dirty: boolean = false
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
  /** 副作用句柄 */
  protected readonly effectHandle: EffectHandle
  /**
   * 构造函数
   * @param options 调试钩子选项
   */
  constructor(options: WatcherOptions = {}) {
    const { flush = 'pre', scope } = options
    super(scope)
    const scheduler = Watcher.schedulerMap[flush]
    if (!scheduler) {
      logger.warn(`[Watcher] Invalid flush option: ${flush}`)
      this.scheduler = queuePreFlushJob
    } else {
      this.scheduler = scheduler
    }
    const execute = (): void => {
      if (!this.isActive) {
        this.dirty = true
        return
      }
      this.runCleanup()
      this.runEffect()
    }
    this.effectHandle = () => this.scheduler(execute)
    // 判断是否为开发环境
    if (__DEV__) {
      bindDebuggerOptions(this.effectHandle, options)
    }
  }
  /**
   * 添加清理函数
   *
   * @param cleanupFn - 清理函数
   * @throws {TypeError} 如果清理函数不是函数类型，则抛出一个类型错误
   */
  public readonly onCleanup = (cleanupFn: VoidCallback): void => {
    if (typeof cleanupFn !== 'function') {
      throw new TypeError('[onWatcherCleanup] Invalid cleanup function.')
    }
    this.cleanups.push(cleanupFn)
  }
  /**
   * 重写恢复后的处理方法
   * 当组件或实例恢复后，此方法会被调用
   * 主要用于检查是否有未执行的任务，并在需要时重新调度执行
   */
  protected override afterResume() {
    // 检查是否有标记为"dirty"的未执行任务
    if (this.dirty) {
      this.dirty = false
      this.effectHandle()
    }
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
    clearEffectLinks(this.effectHandle)
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
  protected override reportError(e: unknown, source: string): void {
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
