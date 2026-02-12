import { describe, expect, it, vi } from 'vitest'
import {
  clearAllJobs,
  flushSync,
  nextTick,
  queueJob,
  queuePostFlushJob,
  queuePreFlushJob,
  removeJob
} from '../../../src/index.js'

describe('watcher/scheduler', () => {
  beforeEach(() => {
    clearAllJobs()
  })

  afterEach(() => {
    clearAllJobs()
  })

  describe('nextTick', () => {
    it('should return a promise', () => {
      const promise = nextTick()
      expect(promise).toBeInstanceOf(Promise)
    })

    it('should execute callback in next tick', async () => {
      const callback = vi.fn()
      await nextTick(callback)
      expect(callback).toHaveBeenCalled()
    })

    it('should resolve promise without callback', async () => {
      await expect(nextTick()).resolves.toBeUndefined()
    })
  })

  describe('queuePreFlushJob', () => {
    it('should add job to pre flush queue', () => {
      const job = vi.fn()
      queuePreFlushJob(job)
      flushSync()
      expect(job).toHaveBeenCalled()
    })
  })

  describe('queueJob', () => {
    it('should add job to main queue', () => {
      const job = vi.fn()
      queueJob(job)
      flushSync()
      expect(job).toHaveBeenCalled()
    })
  })

  describe('queuePostFlushJob', () => {
    it('should add job to post flush queue', () => {
      const job = vi.fn()
      queuePostFlushJob(job)
      flushSync()
      expect(job).toHaveBeenCalled()
    })
  })

  describe('removeJob', () => {
    it('should remove job from pre flush queue', () => {
      const job = vi.fn()
      queuePreFlushJob(job)
      const removed = removeJob(job, 'pre')
      flushSync()
      expect(removed).toBe(true)
      expect(job).not.toHaveBeenCalled()
    })

    it('should remove job from main queue', () => {
      const job = vi.fn()
      queueJob(job)
      const removed = removeJob(job, 'main')
      flushSync()
      expect(removed).toBe(true)
      expect(job).not.toHaveBeenCalled()
    })

    it('should remove job from post flush queue', () => {
      const job = vi.fn()
      queuePostFlushJob(job)
      const removed = removeJob(job, 'post')
      flushSync()
      expect(removed).toBe(true)
      expect(job).not.toHaveBeenCalled()
    })

    it('should remove job from all queues by default', () => {
      const job = vi.fn()
      queuePreFlushJob(job)
      queueJob(job)
      queuePostFlushJob(job)
      const removed = removeJob(job)
      flushSync()
      expect(removed).toBe(true)
      expect(job).not.toHaveBeenCalled()
    })
  })

  describe('flushSync', () => {
    it('should execute jobs in correct order', () => {
      const executionOrder: string[] = []
      const preJob = vi.fn(() => executionOrder.push('pre'))
      const mainJob = vi.fn(() => executionOrder.push('main'))
      const postJob = vi.fn(() => executionOrder.push('post'))

      queuePostFlushJob(postJob)
      queueJob(mainJob)
      queuePreFlushJob(preJob)

      flushSync()

      expect(executionOrder).toEqual(['pre', 'main', 'post'])
      expect(preJob).toHaveBeenCalled()
      expect(mainJob).toHaveBeenCalled()
      expect(postJob).toHaveBeenCalled()
    })

    it('should execute jobs added during flush', () => {
      const job1 = vi.fn(() => {
        queueJob(job2)
      })
      const job2 = vi.fn()

      queueJob(job1)
      flushSync()

      expect(job1).toHaveBeenCalled()
      expect(job2).toHaveBeenCalled()
    })
  })

  describe('clearAllJobs', () => {
    it('should clear all queues', () => {
      const job1 = vi.fn()
      const job2 = vi.fn()
      const job3 = vi.fn()

      queuePreFlushJob(job1)
      queueJob(job2)
      queuePostFlushJob(job3)

      clearAllJobs()
      flushSync()

      expect(job1).not.toHaveBeenCalled()
      expect(job2).not.toHaveBeenCalled()
      expect(job3).not.toHaveBeenCalled()
    })
  })
})
