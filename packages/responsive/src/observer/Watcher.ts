import { logger } from '@vitarx/utils'
import type { VoidCallback } from '@vitarx/utils/src/index.js'
import { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink, removeEffectDeps } from '../depend/index.js'
import { Effect, type EffectOptions } from '../effect/index.js'
import type { DebuggerHandler, DepEffect, FlushMode } from '../types/index.js'
import { queuePostFlushJob, queuePreFlushJob } from './scheduler.js'

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
 * - 实现 IWatcher 接口的公共部分
 * - 初始化调试钩子
 * - 初始化调度器
 * - 实现trigger调度逻辑
 * - 抽象 run 方法由子类实现
 * - 实现 beforeDispose  和 afterDispose 方法，清理资源
 *
 * 注意：
 * 1. 子类如重写了 beforeDispose / afterDispose，必须调用 super.beforeDispose / afterDispose 来清理资源。
 * 2. 子类必须实现 run 方法，用于执行副作用逻辑。
 * 3. 子类不应该调用 run 方法，如需主动执行可调用 runEffect 方法。（无异步调度）
 * 4. trigger 方法是提供给信号系统使用的，非必要不要调用此方法。（有异步调度）
 * 5. 子类应该需要使用 collectSignal / linkSignalWatcher 助手函数来绑定依赖关系。（销毁时会自动解绑）
 *
 * @abstract
 * @implements DepEffect
 */
export abstract class Watcher extends Effect implements DepEffect {
  /** signal → watcher 链表头 */
  [DEP_LINK_HEAD]?: DepLink;
  /** signal → watcher 链表尾 */
  [DEP_LINK_TAIL]?: DepLink
  /** trigger 调试钩子 */
  onTrigger?: DebuggerHandler
  /** track 调试钩子 */
  onTrack?: DebuggerHandler
  /**
   * 调度器
   *
   * 可以修改，但不建议运行时动态修改。
   *
   * @default `queuePreFlushJob`
   */
  public scheduler: (job: () => void) => void
  /** cleanup 回调 */
  private readonly cleanups: VoidCallback[] = []
  /**
   * 错误源
   *
   * @default 'trigger'
   */
  protected errorSource: string = 'trigger'
  /**
   * 构造函数
   * @param options 调试钩子选项
   */
  protected constructor(options: WatcherOptions = {}) {
    const { flush = 'pre', ...effectOptions } = options
    super(effectOptions)
    if (__DEV__) {
      this.onTrigger = options.onTrigger
      this.onTrack = options.onTrack
    }
    switch (flush) {
      case 'pre':
        this.scheduler = queuePreFlushJob
        break
      case 'sync':
        this.scheduler = (fn: () => void) => fn()
        break
      case 'post':
        this.scheduler = queuePostFlushJob
        break
      default:
        logger.warn(`[Watcher] Invalid flush option: ${options.flush}`)
        this.scheduler = queuePreFlushJob
    }
  }
  /**
   * 响应 signal 变化或触发回调
   *
   * 此方法是由信号触发器调用的，子类需实现抽象run方法。
   */
  schedule(): void {
    if (!this.isActive) return
    this.scheduler(this.execute)
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
   * 在对象被销毁前执行清理操作
   * 这是一个重写的方法，用于在组件或实例被销毁前执行必要的清理工作
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  protected override beforeDispose() {
    // 调用清理方法，执行资源释放等清理操作
    this.cleanup()
  }

  /**
   * 运行副作用并处理可能出现的错误
   *
   * 该方法会尝试执行run方法，并根据执行结果进行错误处理
   *
   * 此方法不会触发异步调度
   */
  execute = (): void => {
    if (!this.isActive) return
    this.cleanup()
    try {
      this.run()
    } catch (e) {
      this.reportError(e, this.errorSource)
    }
  }

  /**
   * 在对象被销毁后执行的清理方法
   * 重写父类的afterDispose方法，用于释放资源
   */
  protected override afterDispose() {
    // 移除所有相关的依赖观察者，防止内存泄漏
    removeEffectDeps(this)
    // 将触发回调函数置为undefined，清除引用
    this.onTrigger = undefined
    // 将追踪回调函数置为undefined，清除引用
    this.onTrack = undefined
  }

  /**
   * 运行副作用
   *
   * 此方法由子类实现，用于执行副作用逻辑。
   *
   * 子类应该不应该调用 run 方法，必要时可 syncTrigger 方法。
   */
  protected abstract run(): void
  protected override reportError(e: unknown, source: string) {
    super.reportError(e, `watcher.${source}`)
  }
  /**
   * 清理方法，用于执行所有注册的清理函数并清空清理函数列表
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  private cleanup(): void {
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
