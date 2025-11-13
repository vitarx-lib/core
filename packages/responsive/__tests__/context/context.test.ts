import { describe, expect, it } from 'vitest'
import { Context } from '../../src/index.js'

describe('Context', () => {
  describe('基本功能', () => {
    it('应能设置和获取上下文', () => {
      Context.run('user', { id: 1 }, () => {
        expect(Context.get('user')).toEqual({ id: 1 })
      })
      // 执行完应恢复
      expect(Context.get('user')).toBeUndefined()
    })

    it('run 执行时应能嵌套上下文', () => {
      Context.run('a', { name: 'outer' }, () => {
        expect(Context.get('a')?.name).toBe('outer')
        Context.run('a', { name: 'inner' }, () => {
          expect(Context.get('a')?.name).toBe('inner')
          return 'ok'
        })
        expect(Context.get('a')?.name).toBe('outer')
      })
      expect(Context.get('a')).toBeUndefined()
    })
  })

  describe('异步行为', () => {
    it('withAsyncContext 应保持上下文恢复', async () => {
      Context.run('user', { id: 42 }, () => {
        expect(Context.get('user')?.id).toBe(42)
      })

      // 模拟 await 后恢复
      await Context.run('session', { sid: 'abc' }, async () => {
        expect(Context.get('session')?.sid).toBe('abc')
        await Context.withAsyncContext(async () => {
          // 临时异步上下文中应保持原值
          expect(Context.get('session')?.sid).toBe('abc')
          await Context.withAsyncContext(new Promise(r => setTimeout(r, 10)))
          expect(Context.get('session')?.sid).toBe('abc')
        })
        // 返回后应仍保持一致
        expect(Context.get('session')?.sid).toBe('abc')
      })
    })

    it('run 在异步函数中也应保持独立上下文', async () => {
      const logs: any[] = []
      await Promise.all([
        Context.run('req', { id: 1 }, async () => {
          new Promise(r => setTimeout(r, 5))
          logs.push(Context.get('req')?.id)
        }),
        Context.run('req', { id: 2 }, async () => {
          new Promise(r => setTimeout(r, 2))
          logs.push(Context.get('req')?.id)
        })
      ])
      // 并发请求不应串 context
      expect(new Set(logs)).toEqual(new Set([1, 2]))
    })
    it('withAsyncContext 应在异步任务中恢复', async () => {
      await Context.run('user', { id: 0 }, async () => {
        await Context.run('user2', { id: 1 }, async () => {
          await Context.withAsyncContext(async () => {
            expect(Context.get('user')?.id).toBe(0)
            expect(Context.get('user2')?.id).toBe(1)
            await new Promise(r => setTimeout(r, 10))
          })
          expect(Context.get('user')?.id).toBe(0)
          expect(Context.get('user2')?.id).toBe(1)
        })
      })
      expect(Context.get('user')).toBe(undefined)
      expect(Context.get('user2')).toBe(undefined)
    })
  })

  describe('浏览器端 withAsyncContext 模拟', () => {
    it('应在浏览器端挂起并恢复全局上下文', async () => {
      // 直接操作全局 store 模拟
      Context.run('key', { value: 'test' }, () => {
        expect(Context.get('key')?.value).toBe('test')
      })

      await Context.withAsyncContext(async () => {
        expect(Context.store).toBeInstanceOf(Map)
        Context.run('k2', { ok: true }, () => {
          expect(Context.get('k2')?.ok).toBe(true)
        })
      })
    })
  })
})
