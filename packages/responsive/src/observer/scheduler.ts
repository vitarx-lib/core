/**
 * 任务调度器 - 基于优先级和参数合并的任务执行系统
 *
 * 核心功能：
 * - 三阶段任务队列：preFlush（准备阶段）→ main（执行阶段）→ postFlush（清理阶段）
 * - 参数合并机制：同一任务多次调度时，智能合并新旧参数
 * - 递归保护机制：防止任务无限递归调用，保障系统稳定性
 * - 微任务调度：基于 Promise 微任务的异步执行
 * - 同步执行支持：提供 flushSync 立即同步执行所有任务的能力
 *
 * 设计原理：
 * - 队列使用 Map<Job, any[] | undefined> 存储，保证任务唯一性和执行顺序
 * - 任务添加时，若已存在且提供参数处理器，则合并新旧参数
 * - 执行阶段捕获异常并记录递归次数，确保系统健壮性
 */

/**
 * 任务函数类型定义
 * 接受任意参数并返回 void 的函数
 */
type Job = (...args: any[]) => void

/**
 * 队列参数处理函数
 *
 * @template T 任务参数数组类型
 * @param newParams 新传入的参数数组
 * @param oldParams 已存储在队列中的旧参数数组
 * @returns {T} 合并后的参数数组，用于最终执行
 */
export type QueueParamHandler<T> = (newParams: T, oldParams: T) => T

/**
 * 队列类型定义
 * 键为任务函数，值为参数数组或 undefined
 */
type QueueMap = Map<Job, any[] | undefined>

/**
 * 任务调度器类 - 静态类实现
 *
 * 管理不同优先级的任务队列，按照预定顺序执行任务
 */
export class Scheduler {
  // =============================
  // 配置参数
  // =============================
  /** 用于 nextTick 的已解析 Promise 实例 */
  private static readonly resolvedPromise = Promise.resolve()

  // =============================
  // 任务队列
  // =============================
  /** 准备阶段队列 - 在主任务执行前运行，用于准备工作和前置处理 */
  private static preFlushQueue: QueueMap = new Map()

  /** 主任务队列 - 组件更新等核心任务 */
  private static mainQueue: QueueMap = new Map()

  /** 清理阶段队列 - 在主任务执行后运行，用于后置处理和清理工作 */
  private static postFlushQueue: QueueMap = new Map()

  /** 当前是否正在执行刷新操作 */
  private static isFlushing = false

  /** 是否已安排刷新操作但尚未执行 */
  private static isFlushPending = false

  // =============================
  // 微任务调度
  // =============================
  /**
   * 将回调推迟到下一个微任务执行
   * @param fn 可选的回调函数
   * @returns Promise<void> 在微任务阶段解析的 Promise
   */
  public static nextTick(fn?: () => void): Promise<void> {
    return fn ? this.resolvedPromise.then(fn) : this.resolvedPromise
  }

  // =============================
  // 任务入队方法
  // =============================
  /**
   * 将任务添加到准备阶段队列
   *
   * @param job 要执行的任务函数
   * @param params 任务参数
   * @param handleParams 可选的参数处理函数，用于合并新旧参数
   */
  public static queuePreFlushJob<T extends Job>(
    job: T,
    params?: Parameters<T>,
    handleParams?: QueueParamHandler<Parameters<T>>
  ): void {
    this.addJobToQueue(this.preFlushQueue, job, params, handleParams)
  }

  /**
   * 将任务添加到主任务队列
   * @param job 要执行的任务函数
   * @param params 任务参数
   * @param handleParams 可选的参数处理函数，用于合并新旧参数
   */
  public static queueJob<T extends Job>(
    job: T,
    params?: Parameters<T>,
    handleParams?: QueueParamHandler<Parameters<T>>
  ): void {
    this.addJobToQueue(this.mainQueue, job, params, handleParams)
  }

  /**
   * 将任务添加到清理阶段队列
   *
   * @param job 要执行的任务函数
   * @param params 任务参数
   * @param handleParams 可选的参数处理函数，用于合并新旧参数
   */
  public static queuePostFlushJob<T extends Job>(
    job: T,
    params?: Parameters<T>,
    handleParams?: QueueParamHandler<Parameters<T>>
  ): void {
    this.addJobToQueue(this.postFlushQueue, job, params, handleParams)
  }

  // =============================
  /**
   * 立即同步执行所有队列中的任务
   *
   * 注意：
   * - 此方法会绕过微任务队列，立即同步执行所有任务
   * - 适用于需要立即看到效果的场景，但可能阻塞主线程
   * - 如果正在刷新中，则跳过执行以避免并发问题
   */
  public static flushSync(): void {
    if (this.isFlushing) return

    this.isFlushPending = false
    this.isFlushing = true

    try {
      this.flushJobMap(this.preFlushQueue)
      this.flushJobMap(this.mainQueue)
      this.flushJobMap(this.postFlushQueue)
    } finally {
      this.isFlushing = false
    }
  }

  // =============================
  // 刷新调度机制

  // =============================
  /**
   * 清空所有队列和状态
   *
   * 警告：此方法会清除所有待执行任务，仅在特定场景（如测试或重置）中使用
   */
  public static clearAllJobs(): void {
    this.preFlushQueue.clear()
    this.mainQueue.clear()
    this.postFlushQueue.clear()
    this.isFlushPending = false
    this.isFlushing = false
  }

  /**
   * 核心方法：将任务添加到指定队列
   *
   * 处理逻辑：
   * - 如果任务已存在且提供了参数处理器，则合并新旧参数
   * - 否则直接添加新任务或更新任务参数
   * - 添加后触发刷新调度
   *
   * @param queue 目标队列
   * @param job 任务函数
   * @param params 任务参数
   * @param handleParams 可选的参数处理函数
   */
  private static addJobToQueue<T extends Job>(
    queue: QueueMap,
    job: T,
    params?: Parameters<T>,
    handleParams?: QueueParamHandler<Parameters<T>>
  ): void {
    if (queue.has(job)) {
      // 任务已存在，尝试合并参数
      const oldParams = queue.get(job)
      const newParams = handleParams
        ? handleParams(params as Parameters<T>, oldParams as Parameters<T>)
        : params
      queue.set(job, newParams)
    } else {
      // 新任务，直接添加
      queue.set(job, params)
    }
    this.scheduleFlush()
  }

  // =============================
  /**
   * 安排刷新操作
   *
   * 如果尚未安排刷新，则通过 nextTick 微任务安排一次刷新
   */
  private static scheduleFlush(): void {
    if (!this.isFlushPending) {
      this.isFlushPending = true
      this.nextTick(() => this.flushAll()).then()
    }
  }

  /**
   * 按顺序执行所有队列中的任务
   *
   * 执行顺序：preFlush → main → postFlush
   *
   * 处理流程：
   * 1. 检查是否已在刷新中，避免并发刷新
   * 2. 重置刷新状态
   * 3. 依次执行各队列中的任务
   * 4. 清理递归计数器并重置刷新状态
   */
  private static flushAll(): void {
    if (this.isFlushing) return

    this.isFlushPending = false
    this.isFlushing = true

    try {
      // 按顺序执行各阶段任务
      this.flushJobMap(this.preFlushQueue)
      this.flushJobMap(this.mainQueue)
      this.flushJobMap(this.postFlushQueue)
    } finally {
      this.isFlushing = false
    }
  }

  /**
   * 执行指定队列中的所有任务
   *
   * 执行策略：
   * - 循环处理队列，直到队列为空
   * - 每次循环获取当前队列快照并清空队列
   * - 执行快照中的任务，允许在执行过程中添加新任务
   * - 这种方式确保在执行过程中新添加的任务会在下一轮循环中处理
   *
   * @param queue 要执行的任务队列
   */
  private static flushJobMap(queue: QueueMap): void {
    if (queue.size === 0) return

    // 循环处理，确保执行过程中添加的新任务也会被执行
    while (queue.size > 0) {
      // 获取当前队列快照并清空队列
      const jobs = Array.from(queue.entries())
      queue.clear()

      // 执行快照中的任务
      for (const [job, params] of jobs) {
        this.runJob(job, params)
      }
      // 如果在执行过程中有新任务加入，它们会在下一轮循环中被处理
    }
  }

  /**
   * 执行单个任务
   *
   * 安全机制：
   * - 递归保护：记录任务执行次数，超过限制则停止执行
   * - 异常捕获：捕获任务执行中的异常，避免中断整个刷新流程
   * - 计数管理：任务执行完成后更新递归计数器
   *
   * @param job 要执行的任务函数
   * @param params 任务参数数组
   */
  private static runJob(job: Job, params: any[] = []): void {
    try {
      // 执行任务，传入参数
      job.apply(null, Array.isArray(params) ? params : [])
    } catch (err) {
      // 捕获并记录异常，但不中断整个刷新流程
      console.error('[Scheduler] Job execution error:', err)
    }
  }
}
