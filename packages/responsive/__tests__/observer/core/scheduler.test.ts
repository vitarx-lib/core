/**
 * 调度器单元测试
 *
 * 测试覆盖范围：
 * - 任务队列管理（preFlush、main、postFlush）
 * - 参数合并机制
 * - 执行顺序
 * - 递归保护
 * - 异步执行和同步执行
 * - 错误处理
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scheduler, Subscriber } from '../../../src/index.js'

describe('Scheduler', () => {
  // 在每个测试前清空所有队列
  beforeEach(() => {
    Scheduler.clearAllJobs()
  })

  describe('基础功能', () => {
    it('应该能够添加任务到各个队列', () => {
      const preJob = vi.fn()
      const mainJob = vi.fn()
      const postJob = vi.fn()

      Scheduler.queuePreFlushJob(preJob)
      Scheduler.queueJob(mainJob)
      Scheduler.queuePostFlushJob(postJob)

      // 使用 flushSync 立即执行所有任务
      Scheduler.flushSync()

      expect(preJob).toHaveBeenCalledTimes(1)
      expect(mainJob).toHaveBeenCalledTimes(1)
      expect(postJob).toHaveBeenCalledTimes(1)
    })

    it('应该按照 preFlush -> main -> postFlush 的顺序执行任务', () => {
      const executionOrder: string[] = []

      Scheduler.queuePostFlushJob(() => executionOrder.push('post'))
      Scheduler.queueJob(() => executionOrder.push('main'))
      Scheduler.queuePreFlushJob(() => executionOrder.push('pre'))

      Scheduler.flushSync()

      expect(executionOrder).toEqual(['pre', 'main', 'post'])
    })

    it('应该能够使用 nextTick 延迟执行', async () => {
      const job = vi.fn()

      Scheduler.nextTick(job)

      // 立即检查，任务应该尚未执行
      expect(job).not.toHaveBeenCalled()

      // 等待微任务执行
      await Scheduler.nextTick()

      expect(job).toHaveBeenCalledTimes(1)
    })
  })

  describe('参数处理', () => {
    it('应该能够传递参数给任务', () => {
      const job = vi.fn()
      const params = ['param1', 'param2']

      Scheduler.queueJob(job, params)
      Scheduler.flushSync()

      expect(job).toHaveBeenCalledWith(...params)
    })

    it('应该能够合并参数', () => {
      const job = vi.fn()

      // 第一次添加任务
      Scheduler.queueJob(job, ['first'])

      // 第二次添加同一任务，提供参数合并函数
      Scheduler.queueJob(job, ['second'], (newParams, oldParams) => [...oldParams, ...newParams])

      Scheduler.flushSync()

      // 应该合并参数
      expect(job).toHaveBeenCalledWith('first', 'second')
    })

    it('如果没有提供参数处理函数，应该使用新参数覆盖旧参数', () => {
      const job = vi.fn()

      // 第一次添加任务
      Scheduler.queueJob(job, ['first'])

      // 第二次添加同一任务，不提供参数处理函数
      Scheduler.queueJob(job, ['second'])

      Scheduler.flushSync()

      // 应该只使用新参数
      expect(job).toHaveBeenCalledWith('second')
    })
  })

  describe('任务队列管理', () => {
    it('同一任务多次添加应该只执行一次', () => {
      const job = vi.fn()

      Scheduler.queueJob(job)
      Scheduler.queueJob(job)
      Scheduler.queueJob(job)

      Scheduler.flushSync()

      expect(job).toHaveBeenCalledTimes(1)
    })

    it('任务执行过程中添加的新任务应该在同一刷新周期内执行', () => {
      const executionOrder: string[] = []

      // 添加一个会在执行过程中添加新任务的任务
      Scheduler.queueJob(() => {
        executionOrder.push('job1')
        Scheduler.queueJob(() => {
          executionOrder.push('job2')
        })
      })

      Scheduler.flushSync()

      expect(executionOrder).toEqual(['job1', 'job2'])
    })
  })

  describe('错误处理', () => {
    it('应该捕获任务执行中的错误，不中断整个刷新流程', () => {
      const errorJob = vi.fn(() => {
        throw new Error('Test error')
      })
      const normalJob = vi.fn()

      // 添加会出错的任务和正常任务
      Scheduler.queueJob(errorJob)
      Scheduler.queueJob(normalJob)

      // 使用 spy 监听 console.error
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      Scheduler.flushSync()

      // 两个任务都应该被执行，尽管第一个会出错
      expect(errorJob).toHaveBeenCalledTimes(1)
      expect(normalJob).toHaveBeenCalledTimes(1)

      // 应该记录错误
      expect(errorSpy).toHaveBeenCalledWith('[Scheduler] Job execution error:', expect.any(Error))

      // 恢复 console.error
      errorSpy.mockRestore()
    })
  })

  describe('同步执行', () => {
    it('flushSync 应该立即同步执行所有任务', () => {
      const job = vi.fn()

      Scheduler.queueJob(job)

      // 任务应该尚未执行
      expect(job).not.toHaveBeenCalled()

      // 使用 flushSync 立即执行
      Scheduler.flushSync()

      // 任务应该已经执行
      expect(job).toHaveBeenCalledTimes(1)
    })

    it('flushSync 应该避免并发刷新', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()

      // 添加任务
      Scheduler.queueJob(job1)
      Scheduler.queueJob(job2)
      Scheduler.flushSync()
      // job1 应该被执行，job2 也应该被执行
      expect(job1).toHaveBeenCalledTimes(1)
      expect(job2).toHaveBeenCalledTimes(1)
    })
  })

  describe('与订阅者的集成', () => {
    it('应该能够调度订阅者的触发', () => {
      const callback = vi.fn()
      const subscriber = new Subscriber(callback)

      // 调度订阅者的触发
      Scheduler.queueJob(() => subscriber.trigger('test'))

      Scheduler.flushSync()

      expect(callback).toHaveBeenCalledWith('test')
    })

    it('应该能够处理订阅者的限制次数', () => {
      const callback = vi.fn()
      // 监视 console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 创建限制触发次数为2的订阅者
      const subscriber = new Subscriber(callback, { limit: 2, flush: 'sync' })

      // 调度订阅者的触发3次
      subscriber.trigger('test1')
      subscriber.trigger('test2')
      subscriber.trigger('test3')

      // 回调应该只被调用2次
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenNthCalledWith(1, 'test1')
      expect(callback).toHaveBeenNthCalledWith(2, 'test2')

      // 验证 console.warn 是否被调用过
      expect(consoleWarnSpy).toHaveBeenCalled()

      // 恢复 console.warn 的原始实现
      consoleWarnSpy.mockRestore()
    })
  })

  describe('清理功能', () => {
    it('clearAllJobs 应该清空所有队列和状态', () => {
      const preJob = vi.fn()
      const mainJob = vi.fn()
      const postJob = vi.fn()

      // 添加任务到各个队列
      Scheduler.queuePreFlushJob(preJob)
      Scheduler.queueJob(mainJob)
      Scheduler.queuePostFlushJob(postJob)

      // 清空所有任务
      Scheduler.clearAllJobs()

      // 再次执行，任务不应该被执行
      Scheduler.flushSync()

      expect(preJob).not.toHaveBeenCalled()
      expect(mainJob).not.toHaveBeenCalled()
      expect(postJob).not.toHaveBeenCalled()
    })
  })

  describe('任务移除功能', () => {
    it('removePreFlushJob 应该能够移除准备阶段队列中的任务', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()

      Scheduler.queuePreFlushJob(job1)
      Scheduler.queuePreFlushJob(job2)

      // 移除 job1
      const removed = Scheduler.removePreFlushJob(job1)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      // job1 不应该被执行，job2 应该被执行
      expect(job1).not.toHaveBeenCalled()
      expect(job2).toHaveBeenCalledTimes(1)
    })

    it('removeJob 应该能够移除主任务队列中的任务', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()

      Scheduler.queueJob(job1)
      Scheduler.queueJob(job2)

      // 移除 job1
      const removed = Scheduler.removeJob(job1)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      // job1 不应该被执行，job2 应该被执行
      expect(job1).not.toHaveBeenCalled()
      expect(job2).toHaveBeenCalledTimes(1)
    })

    it('removePostFlushJob 应该能够移除清理阶段队列中的任务', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()

      Scheduler.queuePostFlushJob(job1)
      Scheduler.queuePostFlushJob(job2)

      // 移除 job1
      const removed = Scheduler.removePostFlushJob(job1)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      // job1 不应该被执行，job2 应该被执行
      expect(job1).not.toHaveBeenCalled()
      expect(job2).toHaveBeenCalledTimes(1)
    })

    it('移除不存在的任务应该返回 false', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()

      Scheduler.queueJob(job1)

      // 尝试移除未添加的任务
      const removed = Scheduler.removeJob(job2)

      expect(removed).toBe(false)
    })

    it('removeJobFromAll 应该能够从所有队列中移除任务', () => {
      const job = vi.fn()

      // 将同一任务添加到所有队列（实际场景可能不会这样，但用于测试）
      Scheduler.queuePreFlushJob(job)
      Scheduler.queueJob(job)
      Scheduler.queuePostFlushJob(job)

      // 从所有队列中移除
      const removed = Scheduler.removeJobFromAll(job)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      // 任务不应该被执行
      expect(job).not.toHaveBeenCalled()
    })

    it('removeJobFromAll 应该在任意队列中移除成功时返回 true', () => {
      const job = vi.fn()

      // 只添加到主队列
      Scheduler.queueJob(job)

      // 从所有队列中移除
      const removed = Scheduler.removeJobFromAll(job)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      expect(job).not.toHaveBeenCalled()
    })

    it('removeJobFromAll 在所有队列都不存在时应该返回 false', () => {
      const job = vi.fn()

      // 不添加任务，直接尝试移除
      const removed = Scheduler.removeJobFromAll(job)

      expect(removed).toBe(false)
    })

    it('应该能够在执行前移除带参数的任务', () => {
      const job = vi.fn()

      Scheduler.queueJob(job, ['param1', 'param2'])

      // 移除任务
      const removed = Scheduler.removeJob(job)

      expect(removed).toBe(true)

      Scheduler.flushSync()

      // 任务不应该被执行
      expect(job).not.toHaveBeenCalled()
    })

    it('移除任务后再次添加应该能够正常执行', () => {
      const job = vi.fn()

      // 添加任务
      Scheduler.queueJob(job, ['first'])

      // 移除任务
      Scheduler.removeJob(job)

      // 再次添加任务
      Scheduler.queueJob(job, ['second'])

      Scheduler.flushSync()

      // 任务应该只执行一次，使用第二次的参数
      expect(job).toHaveBeenCalledTimes(1)
      expect(job).toHaveBeenCalledWith('second')
    })

    it('应该能够移除多个不同的任务', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()
      const job3 = vi.fn()

      Scheduler.queueJob(job1)
      Scheduler.queueJob(job2)
      Scheduler.queueJob(job3)

      // 移除 job1 和 job3
      Scheduler.removeJob(job1)
      Scheduler.removeJob(job3)

      Scheduler.flushSync()

      // 只有 job2 应该被执行
      expect(job1).not.toHaveBeenCalled()
      expect(job2).toHaveBeenCalledTimes(1)
      expect(job3).not.toHaveBeenCalled()
    })
  })
})
