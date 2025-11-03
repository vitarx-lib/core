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
 */
export function withDelayAndTimeout<T>(
  task: Promise<T>,
  options: DelayTimeoutOptions<T>
): Promise<T> & { cancel: () => void } {
  const { delay = 0, timeout = 0, onDelay, onTimeout, onResolve, onReject, signal } = options

  let delayTimer: number | undefined
  let timeoutTimer: number | undefined
  let isSettled = false

  const clearTimers = () => {
    if (delayTimer) clearTimeout(delayTimer)
    if (timeoutTimer) clearTimeout(timeoutTimer)
  }

  const promise = new Promise<T>((resolve, reject) => {
    if (delay > 0 && onDelay) {
      delayTimer = setTimeout(() => {
        if (!isSettled && !signal?.()) onDelay()
      }, delay) as unknown as number
    } else if (delay <= 0 && onDelay && !signal?.()) {
      onDelay()
    }

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

  ;(promise as any).cancel = () => {
    if (isSettled) return
    isSettled = true
    clearTimers()
  }

  return promise as Promise<T> & { cancel: () => void }
}
