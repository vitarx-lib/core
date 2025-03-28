import { beforeEach, describe, expect, it } from 'vitest'
import { Context } from '../../src/context/context'

describe('Context', () => {
  beforeEach(() => {
    Context.clear()
  })

  describe('store属性', () => {
    it('应该返回只读的store', () => {
      const store = Context.store
      expect(store).toBeInstanceOf(Map)
    })
  })

  describe('size属性', () => {
    it('空store应该返回0', () => {
      expect(Context.size).toBe(0)
    })

    it('应该返回正确的size', () => {
      Context.set('test', {})
      expect(Context.size).toBe(1)
    })
  })

  describe('tags属性', () => {
    it('应该返回tags的迭代器', () => {
      Context.set('test1', {})
      Context.set('test2', {})
      const tags = Array.from(Context.tags)
      expect(tags).toEqual(['test1', 'test2'])
    })
  })

  describe('get方法', () => {
    it('不存在的tag应该返回undefined', () => {
      expect(Context.get('test')).toBeUndefined()
    })

    it('存在的tag应该返回对应的context', () => {
      const ctx = { value: 1 }
      Context.set('test', ctx)
      expect(Context.get('test')).toBe(ctx)
    })
  })

  describe('unset方法', () => {
    it('应该能通过tag删除context', () => {
      Context.set('test', {})
      expect(Context.unset('test')).toBe(true)
      expect(Context.get('test')).toBeUndefined()
    })

    it('只有匹配的context才会被删除', () => {
      const ctx = { value: 1 }
      Context.set('test', ctx)
      expect(Context.unset('test', {})).toBe(false)
      expect(Context.unset('test', ctx)).toBe(true)
    })
  })

  describe('run方法', () => {
    it('应该在指定上下文中运行函数', () => {
      const ctx = { value: 1 }
      const result = Context.run('test', ctx, () => {
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

      await Context.withAsyncContext(async () => {
        expect(Context.get('test1')?.value).toBe(1)
        expect(Context.get('test2')?.value).toBe(2)
        return 'done'
      })
      expect(Context.get('test1')).toBeDefined()
      expect(Context.get('test2')).toBeDefined()
    })
  })

  describe('clear方法', () => {
    it('应该清除所有上下文', () => {
      Context.set('test1', {})
      Context.set('test2', {})
      Context.clear()
      expect(Context.size).toBe(0)
    })
  })

  describe('set方法', () => {
    it('应该能恢复之前的上下文', () => {
      const ctx1 = { value: 1 }
      const ctx2 = { value: 2 }
      Context.set('test', ctx1, false)
      const restore = Context.set('test', ctx2, true)
      restore()
      expect(Context.get('test')).toBe(ctx1)
    })

    it('不备份时应该替换上下文', () => {
      const ctx = { value: 1 }
      const restore = Context.set('test', ctx, false)
      restore()
      expect(Context.get('test')).toBeUndefined()
    })
  })
})
