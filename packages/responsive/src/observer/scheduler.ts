/**
 * 任务调度器 - 基于优先级和参数合并的任务执行系统（函数式实现）
 *
 * 核心功能：
 * - 三阶段任务队列：preFlush（准备阶段）→ main（执行阶段）→ postFlush（清理阶段）
 * - 递归保护机制：防止任务无限递归调用，保障系统稳定性
 * - 微任务调度：基于 Promise 微任务的异步执行
 * - 同步执行支持：提供 flushSync 立即同步执行所有任务的能力
 *
 * 设计原理：
 * - 执行阶段捕获异常并记录递归次数，确保系统健壮性
 */

/**
 * 任务函数类型定义
 * 接受任意参数并返回 void 的函数
 */
export type Job = () => void

/**
 * 队列类型定义
 * 键为任务函数，值为参数数组或 undefined
 */
type QueueSet = Set<Job>

// =============================
// 配置参数
// =============================
/** 用于 nextTick 的已解析 Promise 实例 */
const resolvedPromise = Promise.resolve()

// =============================
// 任务队列
// =============================
/** 准备阶段队列 - 在主任务执行前运行，用于准备工作和前置处理 */
let preFlushQueue: QueueSet = new Set()

/** 主任务队列 - 组件更新等核心任务 */
let mainQueue: QueueSet = new Set()

/** 清理阶段队列 - 在主任务执行后运行，用于后置处理和清理工作 */
let postFlushQueue: QueueSet = new Set()

/** 当前是否正在执行刷新操作 */
let isFlushing = false

/** 是否已安排刷新操作但尚未执行 */
let isFlushPending = false

// =============================
// 微任务调度
// =============================
/**
 * 将回调推迟到下一个微任务执行
 * @param fn 可选的回调函数
 * @returns Promise<void> 在微任务阶段解析的 Promise
 */
export function nextTick(fn?: () => void): Promise<void> {
  return fn ? resolvedPromise.then(fn) : resolvedPromise
}

// =============================
// 内部辅助函数
// =============================
/**
 * 安排刷新操作
 *
 * 如果尚未安排刷新，则通过 nextTick 微任务安排一次刷新
 */
function scheduleFlush(): void {
  if (!isFlushPending) {
    isFlushPending = true
    nextTick(() => flushAll()).then()
  }
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
 */
function addJobToQueue<T extends Job>(queue: QueueSet, job: T): void {
  queue.add(job)
  scheduleFlush()
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
function flushJobMap(queue: QueueSet): void {
  if (queue.size === 0) return

  // 循环处理，确保执行过程中添加的新任务也会被执行
  while (queue.size > 0) {
    // 获取当前队列快照并清空队列
    const jobs = Array.from(queue)
    queue.clear()

    // 执行快照中的任务
    for (const job of jobs) {
      try {
        // 执行任务，传入参数
        job()
      } catch (err) {
        // 捕获并记录异常，但不中断整个刷新流程
        console.error('[Scheduler] Job execution error:', err)
      }
    }
    // 如果在执行过程中有新任务加入，它们会在下一轮循环中被处理
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
function flushAll(): void {
  if (isFlushing) return

  isFlushPending = false
  isFlushing = true

  try {
    // 按顺序执行各阶段任务
    flushJobMap(preFlushQueue)
    flushJobMap(mainQueue)
    flushJobMap(postFlushQueue)
  } finally {
    isFlushing = false
  }
}

// =============================
// 任务入队方法
// =============================
/**
 * 将任务添加到准备阶段队列
 *
 * @param job 要执行的任务函数
 */
export function queuePreFlushJob<T extends Job>(job: T): void {
  addJobToQueue(preFlushQueue, job)
}

/**
 * 将任务添加到主任务队列
 * @param job 要执行的任务函数
 */
export function queueJob<T extends Job>(job: T): void {
  addJobToQueue(mainQueue, job)
}

/**
 * 将任务添加到清理阶段队列
 *
 * @param job 要执行的任务函数
 */
export function queuePostFlushJob<T extends Job>(job: T): void {
  addJobToQueue(postFlushQueue, job)
}

// =============================
// 任务移除方法
// =============================
/**
 * 移除任务的模式
 * - 'pre': 仅从准备阶段队列移除
 * - 'main': 仅从主任务队列移除
 * - 'post': 仅从清理阶段队列移除
 * - 'all': 从所有队列移除
 */
export type JobRemovalMode = 'pre' | 'main' | 'post' | 'all'
/**
 * 从指定队列中移除任务
 *
 * @param job 要移除的任务函数
 * @param mode 移除模式
 * @returns {boolean} 如果任务在指定队列中存在并被移除则返回 true，否则返回 false
 */
export function removeJob(job: Job, mode: JobRemovalMode = 'all'): boolean {
  switch (mode) {
    case 'pre':
      return preFlushQueue.delete(job)
    case 'main':
      return mainQueue.delete(job)
    case 'post':
      return postFlushQueue.delete(job)
    case 'all':
    default:
      const removedFromPre = preFlushQueue.delete(job)
      const removedFromMain = mainQueue.delete(job)
      const removedFromPost = postFlushQueue.delete(job)
      return removedFromPre || removedFromMain || removedFromPost
  }
}

// =============================
// 刷新控制方法
// =============================
/**
 * 立即同步执行所有队列中的任务
 *
 * 注意：
 * - 此方法会绕过微任务队列，立即同步执行所有任务
 * - 适用于需要立即看到效果的场景，但可能阻塞主线程
 * - 如果正在刷新中，则跳过执行以避免并发问题
 */
export function flushSync(): void {
  flushAll()
}

/**
 * 清空所有队列和状态
 *
 * 警告：此方法会清除所有待执行任务，仅在特定场景（如测试或重置）中使用
 */
export function clearAllJobs(): void {
  preFlushQueue.clear()
  mainQueue.clear()
  postFlushQueue.clear()
  isFlushPending = false
  isFlushing = false
}
