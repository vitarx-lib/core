import { describe, expect, it } from 'vitest'
import { ObserverManager } from '../../../src/observer/index'

describe('依赖触发器', () => {
  describe('基础触发', () => {
    it('应该正确触发单个属性变更', () => {
      const target = { value: 0 }
      let notifyed = false
      const callback = () => {
        notifyed = true
      }
      ObserverManager.subscribe(target, callback, 'value', { batch: false })
      ObserverManager.notify(target, 'value')
      expect(notifyed).toBe(true)
    })

    it('应该支持多次触发', () => {
      const target = { count: 0 }
      let notifyCount = 0
      const callback = () => {
        notifyCount++
      }
      ObserverManager.subscribe(target, callback, 'count', { batch: false })
      ObserverManager.notify(target, 'count')
      ObserverManager.notify(target, 'count')
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
      ObserverManager.subscribe(target, callback, 'x', { batch: true })
      ObserverManager.subscribe(target, callback, 'y', { batch: true })
      ObserverManager.notify(target, ['x', 'y'])
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
      ObserverManager.subscribe(target, callback, 'value', { batch: true })
      ObserverManager.notify(target, 'value')
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
      ObserverManager.subscribe(target, callback, 'value', { batch: false })
      ObserverManager.notify(target, 'value')
      expect(executed).toBe(true)
    })

    it('应该忽略批处理设置', () => {
      const target = { value: 0 }
      let notifyCount = 0
      const callback = () => {
        notifyCount++
      }
      ObserverManager.subscribe(target, callback, 'value', { batch: false })
      ObserverManager.notify(target, 'value')
      ObserverManager.notify(target, 'value')
      expect(notifyCount).toBe(2)
    })
  })

  describe('多属性触发', () => {
    it('应该支持触发多个属性', () => {
      const target = { x: 0, y: 0 }
      const notifyed = new Set()
      const callback = (prop: string[]) => {
        notifyed.add(prop[0])
      }
      ObserverManager.subscribe(target, callback, 'x', { batch: false })
      ObserverManager.subscribe(target, callback, 'y', { batch: false })
      ObserverManager.notify(target, 'x')
      ObserverManager.notify(target, 'y')
      expect(notifyed.has('x')).toBe(true)
      expect(notifyed.has('y')).toBe(true)
    })

    it('应该正确处理相同回调的多属性触发', async () => {
      const target = { a: 1, b: 2 }
      let callCount = 0
      const callback = () => {
        callCount++
      }
      ObserverManager.subscribeMultipleProperty(target, ['a', 'b'], callback, { batch: true })
      ObserverManager.notify(target, ['a', 'b'])
      expect(callCount).toBe(0)
      await Promise.resolve()
      expect(callCount).toBe(1)
    })
  })
})
