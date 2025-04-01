import { describe, expect, it } from 'vitest'
import { DepTrigger } from '../../src/depend/index'

describe('依赖触发器', () => {
  describe('基础触发', () => {
    it('应该正确触发单个属性变更', () => {
      const target = { value: 0 }
      let triggered = false
      const callback = () => {
        triggered = true
      }
      DepTrigger.subscribe(target, callback, 'value', { batch: false })
      DepTrigger.trigger(target, 'value')
      expect(triggered).toBe(true)
    })

    it('应该支持多次触发', () => {
      const target = { count: 0 }
      let triggerCount = 0
      const callback = () => {
        triggerCount++
      }
      DepTrigger.subscribe(target, callback, 'count', { batch: false })
      DepTrigger.trigger(target, 'count')
      DepTrigger.trigger(target, 'count')
      expect(triggerCount).toBe(2)
    })
  })

  describe('批处理模式', () => {
    it('应该合并多个触发', async () => {
      const target = { x: 0, y: 0 }
      let updateCount = 0
      const callback = () => {
        updateCount++
      }
      DepTrigger.subscribe(target, callback, 'x', { batch: true })
      DepTrigger.subscribe(target, callback, 'y', { batch: true })
      DepTrigger.trigger(target, ['x', 'y'])
      expect(updateCount).toBe(0)
      await Promise.resolve()
      expect(updateCount).toBe(2)
    })

    it('应该在下一个微任务执行回调', async () => {
      const target = { value: 0 }
      let executed = false
      const callback = () => {
        executed = true
      }
      DepTrigger.subscribe(target, callback, 'value', { batch: true })
      DepTrigger.trigger(target, 'value')
      expect(executed).toBe(false)
      await Promise.resolve()
      expect(executed).toBe(true)
    })
  })

  describe('即时模式', () => {
    it('应该立即执行回调', () => {
      const target = { value: 0 }
      let executed = false
      const callback = () => {
        executed = true
      }
      DepTrigger.subscribe(target, callback, 'value', { batch: false })
      DepTrigger.trigger(target, 'value')
      expect(executed).toBe(true)
    })

    it('应该忽略批处理设置', () => {
      const target = { value: 0 }
      let triggerCount = 0
      const callback = () => {
        triggerCount++
      }
      DepTrigger.subscribe(target, callback, 'value', { batch: false })
      DepTrigger.trigger(target, 'value')
      DepTrigger.trigger(target, 'value')
      expect(triggerCount).toBe(2)
    })
  })

  describe('多属性触发', () => {
    it('应该支持触发多个属性', () => {
      const target = { x: 0, y: 0 }
      const triggered = new Set()
      const callback = (prop: string[]) => {
        triggered.add(prop[0])
      }
      DepTrigger.subscribe(target, callback, 'x', { batch: false })
      DepTrigger.subscribe(target, callback, 'y', { batch: false })
      DepTrigger.trigger(target, 'x')
      DepTrigger.trigger(target, 'y')
      expect(triggered.has('x')).toBe(true)
      expect(triggered.has('y')).toBe(true)
    })

    it('应该正确处理相同回调的多属性触发', async () => {
      const target = { a: 1, b: 2 }
      let callCount = 0
      const callback = () => {
        callCount++
      }
      DepTrigger.subscribeToProperties(target, ['a', 'b'], callback, { batch: true })
      DepTrigger.trigger(target, ['a', 'b'])
      expect(callCount).toBe(0)
      await Promise.resolve()
      expect(callCount).toBe(1)
    })
  })
})
