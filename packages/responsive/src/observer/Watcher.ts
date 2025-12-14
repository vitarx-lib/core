import { logger } from '@vitarx/utils'
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
/**
 * Watcher 抽象基类
 * - 实现 IWatcher 接口的公共部分
 * - 初始化调试钩子
 * - 初始化调度器
 * - 实现trigger调度逻辑
 * - 抽象 run 方法由子类实现
 * - 实现 beforeDispose  和 afterDispose 方法，清理资源
 *
 * 注意：子类如重写了 beforeDispose / afterDispose，
 * 必须要调用 super.beforeDispose() / super.afterDispose()，否则会造成内存泄露。
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
      this.scheduler(this.run)
    } else {
      // 如果没有调度器，则直接执行收集函数
      this.run()
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
   * 在对象被销毁前执行清理操作
   * 这是一个重写的方法，用于在组件或实例被销毁前执行必要的清理工作
   *
   * @protected 这是一个受保护的方法，只能在类内部或子类中访问
   */
  protected override beforeDispose() {
    // 移除所有相关的依赖观察者，防止内存泄漏
    removeWatcherDeps(this)
  }
  /**
   * 运行副作用
   *
   * 此方法由子类实现，用于执行副作用逻辑。
   */
  protected abstract run(): void
}
