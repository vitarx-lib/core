import { describe, expect, it } from 'vitest'
import { Context, getContext, runInContext } from '../../src'

describe('Context辅助函数', () => {
  describe('getContext方法', () => {
    it('应该能通过tag获取context', () => {
      const ctx = { value: 1 }
      runInContext('test', ctx, () => {
        expect(getContext('test')).toBe(ctx)
      })
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
    it('异步任务完成后应自动恢复上下文', () => {
      Context.run('test1', { value: 1 }, () => void 0)
      expect(Context.get('test1')).toBeUndefined()
    })
  })
})
