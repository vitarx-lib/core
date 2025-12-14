import { logger } from '@vitarx/utils'
import type { VoidCallback } from '@vitarx/utils/src/index.js'
import { Context } from '../context/index.js'
import { DEP_LINK_HEAD, DEP_LINK_TAIL, DepLink, removeWatcherDeps } from '../depend/index.js'
import { Effect, type EffectOptions } from '../effect/index.js'
import type { DebuggerHandler, FlushMode, IWatcher } from '../types/index.js'
import { queuePostFlushJob, queuePreFlushJob } from './scheduler.js'

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
export type WatcherOnCleanup = (cleanupFn: VoidCallback) => void
const WATCHER_CONTEXT = Symbol.for('__v_watcher_context')
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
 * @implements IWatcher
 */
export abstract class Watcher extends Effect implements IWatcher {
  /** signal → watcher 链表头 */
  [DEP_LINK_HEAD]?: DepLink;
  /** signal → watcher 链表尾 */
  [DEP_LINK_TAIL]?: DepLink
  /** trigger 调试钩子 */
  onTrigger?: DebuggerHandler
  /** track 调试钩子 */
  onTrack?: DebuggerHandler
  /** 调度函数 */
  public scheduler: ((job: () => void) => void) | undefined
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
    super(options)
    if (__DEV__) {
      this.onTrigger = options.onTrigger
      this.onTrack = options.onTrack
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
          logger.warn(`[Watcher] Invalid flush option: ${options.flush}`)
          this.scheduler = queuePreFlushJob
      }
    }
  }
  /**
   * 响应 signal 变化或触发回调
   *
   * 此方法内部封装了调度模式，子类应该实现抽象run方法。
   */
  trigger(): void {
    if (!this.isActive) return
    // 判断是否有调度器
    if (this.scheduler) {
      // 如果有调度器，则将收集函数作为回调传递给调度器
      this.scheduler(this.runEffect)
    } else {
      // 如果没有调度器，则直接执行收集函数
      this.runEffect()
    }
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
  }
  /**
   * 添加清理函数
   *
   * @param cleanupFn
   */
  public onCleanup = (cleanupFn: VoidCallback): void => {
    if (typeof cleanupFn !== 'function') {
      throw new Error('[onWatcherCleanup] Invalid cleanup function.')
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
    // 移除所有相关的依赖观察者，防止内存泄漏
    removeWatcherDeps(this)
  }
  /**
   * 运行副作用
   *
   * 此方法由子类实现，用于执行副作用逻辑。
   *
   * 子类应该不应该调用 run 方法，必要时可 runEffect 方法。
   */
  protected abstract run(): void
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
        this.reportError(e, 'watcher.cleanup')
      }
    }
    // 清空清理函数列表，将数组长度设置为0
    this.cleanups.length = 0
  }
  /**
   * 受保护的方法：运行副作用并处理可能出现的错误
   *
   * 该方法会尝试执行run方法，并根据执行结果进行错误处理
   *
   * 此方法不会触发异步调度
   */
  protected runEffect(): void {
    this.cleanup()
    try {
      Context.run(WATCHER_CONTEXT, this, () => this.run())
    } catch (e) {
      this.reportError(e, `watcher.${this.errorSource}`)
    }
  }
}

/**
 * 用于在观察者(watcher)清理时执行回调函数的工具函数
 *
 * @param cleanupFn - 当观察者被清理时需要执行的回调函数
 * @param silent - 是否在无观察者上下文时静默警告，默认为false
 */
export function onWatcherCleanup(cleanupFn: VoidCallback, silent: boolean = false): void {
  // 获取当前上下文中的观察者实例
  const watcher = Context.get(WATCHER_CONTEXT)
  // 如果存在观察者实例，则将清理函数添加到观察者的清理函数列表中
  if (watcher) {
    watcher.pushCleanup(cleanupFn)
  } else if (!silent) {
    // 如果不存在观察者实例且未设置静默模式，则输出警告日志
    logger.warn('[onWatcherCleanup] No watcher found in the current context.')
  }
}
