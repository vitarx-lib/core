import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearAllContexts,
  Context,
  createContext,
  getAllContextTags,
  getContext,
  getContextCount,
  removeContext,
  runInContext,
  withAsyncContext
} from '../../src'

describe('Context辅助函数', () => {
  beforeEach(() => {
    Context.clear()
  })

  describe('createContext方法', () => {
    it('应该创建并返回恢复函数', () => {
      const ctx = { value: 1 }
      const restore = createContext('test', ctx)
      expect(Context.get('test')).toBe(ctx)
      restore()
      expect(Context.get('test')).toBeUndefined()
    })
  })

  describe('getContext方法', () => {
    it('应该能通过tag获取context', () => {
      const ctx = { value: 1 }
      Context.set('test', ctx)
      expect(getContext('test')).toBe(ctx)
    })
  })

  describe('removeContext方法', () => {
    it('应该能通过tag删除context', () => {
      const ctx = { value: 1 }
      Context.set('test', ctx)
      expect(removeContext('test', ctx)).toBe(true)
      expect(Context.get('test')).toBeUndefined()
    })
  })

  describe('runInContext方法', () => {
    it('应该在指定上下文中运行函数', () => {
      const ctx = { value: 1 }
      const result = runInContext('test', ctx, () => {
        expect(Context.get('test')).toBe(ctx)
        return 'done'
      })
      expect(result).toBe('done')
      expect(Context.get('test')).toBeUndefined()
    })
  })

  describe('withAsyncContext方法', () => {
    it('异步任务完成后应自动恢复上下文', async () => {
      Context.set('test1', { value: 1 })
      Context.set('test2', { value: 2 })

      await withAsyncContext(async () => {
        expect(Context.get('test1')).toBeDefined()
        expect(Context.get('test2')).toBeDefined()
        return 'done'
      }, ['test1', 'test2'])

      expect(Context.get('test1')).toBeDefined()
      expect(Context.get('test2')).toBeDefined()
    })
  })

  describe('clearAllContexts方法', () => {
    it('应该清除所有上下文', () => {
      Context.set('test1', {})
      Context.set('test2', {})
      clearAllContexts()
      expect(Context.size).toBe(0)
    })
  })

  describe('getAllContextTags方法', () => {
    it('应该获取所有context的tag', () => {
      Context.set('test1', {})
      Context.set('test2', {})
      const tags = Array.from(getAllContextTags())
      expect(tags).toEqual(['test1', 'test2'])
    })
  })

  describe('getContextCount方法', () => {
    it('应该获取context的数量', () => {
      Context.set('test1', {})
      Context.set('test2', {})
      expect(getContextCount()).toBe(2)
    })
  })
})
