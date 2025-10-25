import { describe, expect, it } from 'vitest'
import { SubManager } from '../../../src/index.js'

describe('依赖触发器', () => {
  describe('基础触发', () => {
    it('应该正确触发单个属性变更', () => {
      const target = { value: 0 }
      let notified = false
      const callback = () => {
        notified = true
      }
      SubManager.subscribeProperty(target, 'value', callback, { flush: 'sync' })
      SubManager.notify(target, 'value')
      expect(notified).toBe(true)
    })

    it('应该支持多次触发', () => {
      const target = { count: 0 }
      let notifyCount = 0
      const callback = () => {
        notifyCount++
      }
      SubManager.subscribeProperty(target, 'count', callback, { flush: 'sync' })
      SubManager.notify(target, 'count')
      SubManager.notify(target, 'count')
      expect(notifyCount).toBe(2)
    })
  })

  describe('批处理模式', () => {
    it('应该合并多个触发', async () => {
      const target = { x: 0, y: 0 }
      let updateCount = 0
      const callback = () => {
        updateCount++
      }
      SubManager.subscribeProperty(target, 'x', callback)
      SubManager.notify(target, 'x')
      SubManager.notify(target, 'x')
      expect(updateCount).toBe(0)
      await Promise.resolve()
      expect(updateCount).toBe(1)
    })

    it('应该在下一个微任务执行回调', async () => {
      const target = { value: 0 }
      const callback = vi.fn()
      SubManager.subscribeProperty(target, 'value', callback)
      SubManager.notify(target, 'value')
      expect(callback).toHaveBeenCalledTimes(0)
      await Promise.resolve()
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('即时模式', () => {
    it('应该立即执行回调', () => {
      const target = { value: 0 }
      let executed = false
      const callback = () => {
        executed = true
      }
      SubManager.subscribeProperty(target, 'value', callback, { flush: 'sync' })
      SubManager.notify(target, 'value')
      expect(executed).toBe(true)
    })

    it('应该忽略批处理设置', () => {
      const target = { value: 0 }
      let notifyCount = 0
      const callback = () => {
        notifyCount++
      }
      SubManager.subscribeProperty(target, 'value', callback, { flush: 'sync' })
      SubManager.notify(target, 'value')
      SubManager.notify(target, 'value')
      expect(notifyCount).toBe(2)
    })
  })

  describe('多属性触发', () => {
    it('应该支持触发多个属性', () => {
      const target = { x: 0, y: 0 }
      const keys = new Set()
      const callback = (prop: string[]) => {
        keys.add(prop[0])
      }
      SubManager.subscribeProperty(target, 'x', callback, { flush: 'sync' })
      SubManager.subscribeProperty(target, 'y', callback, { flush: 'sync' })
      SubManager.notify(target, 'x')
      SubManager.notify(target, 'y')
      expect(keys.has('x')).toBe(true)
      expect(keys.has('y')).toBe(true)
    })

    it('应该正确处理相同回调的多属性触发', async () => {
      const target = { a: 1, b: 2 }
      let callCount = 0
      const callback = () => {
        callCount++
      }
      SubManager.subscribeProperties(target, ['a', 'b'], callback)
      SubManager.notify(target, ['a', 'b'])
      expect(callCount).toBe(0)
      await Promise.resolve()
      expect(callCount).toBe(1)
    })
  })
})
