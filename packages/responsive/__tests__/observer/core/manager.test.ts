import { describe, expect, it, vi } from 'vitest'
import { hasSubscribers, SubManager } from '../../../src/index.js'

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

  describe('订阅者检查', () => {
    it('应该检查对象是否存在订阅者', () => {
      const target = { value: 0 }

      // 初始状态，没有订阅者
      expect(hasSubscribers(target)).toBe(false)

      // 添加订阅
      const subscriber = SubManager.subscribe(target, () => {})

      // 应该检测到订阅者
      expect(hasSubscribers(target)).toBe(true)

      // 销毁订阅者
      subscriber.dispose()

      // 应该不再有订阅者
      expect(hasSubscribers(target)).toBe(false)
    })

    it('应该检查指定属性是否存在订阅者', () => {
      const target = { name: 'John', age: 30 }

      // 初始状态
      expect(hasSubscribers(target, 'name')).toBe(false)
      expect(hasSubscribers(target, 'age')).toBe(false)

      // 只订阅 name 属性
      const subscriber = SubManager.subscribeProperty(target, 'name', () => {})

      // name 应该有订阅者，age 没有
      expect(hasSubscribers(target, 'name')).toBe(true)
      expect(hasSubscribers(target, 'age')).toBe(false)

      // 整个对象的通用订阅者检查应该返回 false（因为没有订阅所有属性）
      expect(hasSubscribers(target)).toBe(false)

      subscriber.dispose()
      expect(hasSubscribers(target, 'name')).toBe(false)
    })

    it('应该区分全局订阅和属性订阅', () => {
      const target = { value: 0 }

      // 订阅整个对象
      const globalSubscriber = SubManager.subscribe(target, () => {})

      // 全局订阅应该被检测到
      expect(hasSubscribers(target)).toBe(true)

      // 但特定属性没有订阅者
      expect(hasSubscribers(target, 'value')).toBe(false)

      // 添加属性订阅
      const propertySubscriber = SubManager.subscribeProperty(target, 'value', () => {})

      // 现在都应该有
      expect(hasSubscribers(target)).toBe(true)
      expect(hasSubscribers(target, 'value')).toBe(true)

      // 销毁全局订阅
      globalSubscriber.dispose()

      // 全局订阅没有了，但属性订阅还在
      expect(hasSubscribers(target)).toBe(false)
      expect(hasSubscribers(target, 'value')).toBe(true)

      propertySubscriber.dispose()
    })

    it('应该处理多个订阅者的情况', () => {
      const target = { count: 0 }

      const sub1 = SubManager.subscribeProperty(target, 'count', () => {})
      const sub2 = SubManager.subscribeProperty(target, 'count', () => {})

      // 应该检测到订阅者
      expect(hasSubscribers(target, 'count')).toBe(true)

      // 销毁一个
      sub1.dispose()

      // 还有另一个订阅者
      expect(hasSubscribers(target, 'count')).toBe(true)

      // 销毁所有
      sub2.dispose()

      // 现在没有了
      expect(hasSubscribers(target, 'count')).toBe(false)
    })

    it('应该处理多属性订阅', () => {
      const target = { x: 0, y: 0, z: 0 }

      const subscriber = SubManager.subscribeProperties(target, ['x', 'y'], () => {})

      // 订阅的属性应该有订阅者
      expect(hasSubscribers(target, 'x')).toBe(true)
      expect(hasSubscribers(target, 'y')).toBe(true)

      // 未订阅的属性没有
      expect(hasSubscribers(target, 'z')).toBe(false)

      subscriber.dispose()

      expect(hasSubscribers(target, 'x')).toBe(false)
      expect(hasSubscribers(target, 'y')).toBe(false)
    })
  })
})
