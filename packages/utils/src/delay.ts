export interface DelayTimeoutOptions<T = any> {
  /** 延迟触发的毫秒数（如显示loading） */
  delay?: number
  /** 超时时间（毫秒），<=0 不生效 */
  timeout?: number
  /** 延迟触发回调（一般用于显示loading） */
  onDelay?: () => void
  /** 超时回调（返回错误对象） */
  onTimeout?: (error: Error) => void
  /** 可选：在成功时执行 */
  onResolve?: (value: T) => void
  /** 可选：在失败时执行 */
  onReject?: (error: unknown) => void
  /** 可选：判断任务是否还有效 */
  signal?: () => boolean
}

/**
 * 延迟和超时控制包装函数
 *
 * @template T - 任务返回值的类型
 * @param task 需要被包装的Promise任务
 * @param options 配置选项，包含延迟、超时和回调函数
 * @returns {Promise<T> & { cancel: () => void; }} 返回一个带有取消功能的Promise
 *
 * @example
 * ```ts
 * // 基本用法：添加延迟和超时控制
 * const fetchData = () => fetch('/api/data').then(res => res.json());
 * const wrappedTask = withDelayAndTimeout(fetchData(), {
 *   delay: 200, // 200ms后显示加载状态
 *   onDelay: () => console.log('开始加载...'),
 *   timeout: 5000, // 5秒超时
 *   onTimeout: (error) => console.error('请求超时', error),
 *   onResolve: (data) => console.log('数据加载成功', data),
 *   onReject: (error) => console.error('请求失败', error)
 * });
 * ```
 *
 * @example
 * ```ts
 * // 使用signal检查任务是否仍然有效
 * let isActive = true;
 * const wrappedTask = withDelayAndTimeout(fetchData(), {
 *   delay: 200,
 *   timeout: 5000,
 *   signal: () => !isActive, // 如果isActive变为false，任务将被取消
 *   onDelay: () => console.log('开始加载...')
 * });
 *
 * // 稍后取消任务
 * setTimeout(() => {
 *   isActive = false;
 * }, 1000);
 *```
 *
 * @example
 * ```ts
 * // 手动取消任务
 * const wrappedTask = withDelayAndTimeout(fetchData(), {
 *   delay: 200,
 *   timeout: 5000,
 *   onDelay: () => console.log('开始加载...')
 * });
 *
 * // 在某些条件下手动取消
 * if (shouldCancel) {
 *   wrappedTask.cancel();
 * }
 * ```
 */
export function withDelayAndTimeout<T>(
  task: Promise<T> | (() => Promise<T>),
  options: DelayTimeoutOptions<T>
): Promise<T> & { cancel: () => void } {
  // 解构配置选项，设置默认值
  const { delay = 0, timeout = 0, onDelay, onTimeout, onResolve, onReject, signal } = options
  // 声明定时器变量
  let delayTimer: number | undefined
  let timeoutTimer: number | undefined
  // 标记Promise是否已完成
  let isSettled = false

  // 清除所有定时器的工具函数
  const clearTimers = () => {
    if (delayTimer) clearTimeout(delayTimer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
  }

  // 创建并返回一个带有取消功能的Promise
  const promise = new Promise<T>((resolve, reject) => {
    // 处理延迟回调
    if (delay > 0 && onDelay) {
      delayTimer = setTimeout(() => {
        if (!isSettled && !signal?.()) onDelay()
      }, delay) as unknown as number
    } else if (delay <= 0 && onDelay && !signal?.()) {
      onDelay()
    }

    // 处理超时逻辑
    if (timeout > 0 && onTimeout) {
      timeoutTimer = setTimeout(() => {
        if (isSettled || signal?.()) return
        isSettled = true
        const err = new Error(`[withDelayAndTimeout] 任务超时(${timeout}ms)`)
        onTimeout(err)
        reject(err)
        clearTimers()
      }, timeout) as unknown as number
    }

    // 如果task是函数，执行它获取Promise
    if (typeof task === 'function') {
      task = task()
    }

    // 处理原始Promise的成功和失败
    task
      .then(value => {
        if (isSettled || signal?.()) return
        isSettled = true
        clearTimers()
        onResolve?.(value)
        resolve(value)
      })
      .catch(error => {
        if (isSettled || signal?.()) return
        isSettled = true
        clearTimers()
        onReject?.(error)
        reject(error)
      })
  })

  // 添加取消方法到Promise实例
  ;(promise as any).cancel = () => {
    if (isSettled) return
    isSettled = true
    clearTimers()
  }

  return promise as Promise<T> & { cancel: () => void }
}
