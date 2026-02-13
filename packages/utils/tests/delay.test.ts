import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { withDelayTimeout } from '../src/delay'

describe('withDelayAndTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should resolve with the task result', async () => {
    const task = Promise.resolve('result')
    const result = await withDelayTimeout(task, {})
    expect(result).toBe('result')
  })

  it('should reject with the task error', async () => {
    const task = Promise.reject(new Error('task error'))
    const wrappedTask = withDelayTimeout(task, {})
    await expect(wrappedTask).rejects.toThrow('task error')
  })

  it('should call onDelay after delay time', async () => {
    const onDelay = vi.fn()
    const task = new Promise<string>(resolve => {
      setTimeout(() => resolve('done'), 500)
    })
    withDelayTimeout(task, { delay: 100, onDelay })

    expect(onDelay).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(onDelay).toHaveBeenCalledTimes(1)
  })

  it('should call onDelay immediately when delay <= 0', async () => {
    const onDelay = vi.fn()
    const task = new Promise<string>(resolve => {
      setTimeout(() => resolve('done'), 500)
    })
    withDelayTimeout(task, { delay: 0, onDelay })
    expect(onDelay).toHaveBeenCalledTimes(1)
  })

  it('should not call onDelay if task resolves before delay', async () => {
    const onDelay = vi.fn()
    const task = Promise.resolve('quick result')
    await withDelayTimeout(task, { delay: 100, onDelay })
    expect(onDelay).not.toHaveBeenCalled()
  })

  it('should call onTimeout when task exceeds timeout', async () => {
    const onTimeout = vi.fn()
    const task = new Promise<string>(() => {})
    const wrappedTask = withDelayTimeout(task, { timeout: 100, onTimeout })

    vi.advanceTimersByTime(100)
    await Promise.resolve()

    expect(onTimeout).toHaveBeenCalledTimes(1)
    expect(onTimeout).toHaveBeenCalledWith(expect.any(Error))
    await expect(wrappedTask).rejects.toThrow('task timeout (100ms)')
  })

  it('should not timeout if task resolves before timeout', async () => {
    const onTimeout = vi.fn()
    const task = Promise.resolve('result')
    await withDelayTimeout(task, { timeout: 100, onTimeout })
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('should call onResolve when task resolves', async () => {
    const onResolve = vi.fn()
    const task = Promise.resolve('result')
    await withDelayTimeout(task, { onResolve })
    expect(onResolve).toHaveBeenCalledWith('result')
  })

  it('should call onReject when task rejects', async () => {
    const onReject = vi.fn()
    const error = new Error('task error')
    const task = Promise.reject(error)
    const wrappedTask = withDelayTimeout(task, { onReject })

    try {
      await wrappedTask
    } catch {}

    expect(onReject).toHaveBeenCalledWith(error)
  })

  it('should support task as a function', async () => {
    const taskFn = () => Promise.resolve('function result')
    const result = await withDelayTimeout(taskFn, {})
    expect(result).toBe('function result')
  })

  it('should cancel task via cancel method', async () => {
    const onDelay = vi.fn()
    const onTimeout = vi.fn()
    const task = new Promise<string>(() => {})
    const wrappedTask = withDelayTimeout(task, {
      delay: 100,
      timeout: 500,
      onDelay,
      onTimeout
    })

    wrappedTask.cancel()
    vi.advanceTimersByTime(500)

    expect(onDelay).not.toHaveBeenCalled()
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('should not trigger callbacks when signal returns true', async () => {
    const onDelay = vi.fn()
    const onTimeout = vi.fn()
    let cancelled = false

    const task = new Promise<string>(() => {})
    withDelayTimeout(task, {
      delay: 100,
      timeout: 500,
      onDelay,
      onTimeout,
      isActive: () => cancelled
    })

    vi.advanceTimersByTime(50)
    cancelled = true
    vi.advanceTimersByTime(100)

    expect(onDelay).not.toHaveBeenCalled()
  })

  it('should not call onResolve when signal returns true', async () => {
    const onResolve = vi.fn()
    let cancelled = false

    const task = new Promise<string>(resolve => {
      setTimeout(() => resolve('done'), 200)
    })

    const wrappedTask = withDelayTimeout(task, {
      onResolve,
      isActive: () => cancelled
    })

    vi.advanceTimersByTime(100)
    cancelled = true
    vi.advanceTimersByTime(150)

    await Promise.resolve()
    expect(onResolve).not.toHaveBeenCalled()
  })

  it('should not call onReject when signal returns true', async () => {
    const onReject = vi.fn()
    let cancelled = false

    const task = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('error')), 200)
    })

    withDelayTimeout(task, {
      onReject,
      isActive: () => cancelled
    })

    vi.advanceTimersByTime(100)
    cancelled = true
    vi.advanceTimersByTime(150)

    await Promise.resolve()
    expect(onReject).not.toHaveBeenCalled()
  })

  it('should clear timers after task resolves', async () => {
    const onTimeout = vi.fn()
    let resolveTask: (value: string) => void
    const task = new Promise<string>(resolve => {
      resolveTask = resolve
    })

    const wrappedTask = withDelayTimeout(task, { timeout: 100, onTimeout })

    vi.advanceTimersByTime(50)
    resolveTask!('done')
    await vi.runAllTimersAsync()

    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('should not call cancel if already settled', async () => {
    const task = Promise.resolve('result')
    const wrappedTask = withDelayTimeout(task, {})

    await wrappedTask
    wrappedTask.cancel()
  })
})
