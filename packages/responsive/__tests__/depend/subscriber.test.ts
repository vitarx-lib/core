import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Subscriber } from '../../src/depend/index'
import { EffectScope } from '../../src/effect'

describe('Subscriber', () => {
  let callback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    callback = vi.fn()
  })

  describe('基础功能', () => {
    it('应该正确创建订阅者实例', () => {
      const subscriber = new Subscriber(callback)
      expect(subscriber).toBeInstanceOf(Subscriber)
      expect(subscriber.count).toBe(0)
      expect(subscriber.limit).toBe(0)
    })

    it('应该支持自定义配置', () => {
      const subscriber = new Subscriber(callback, { limit: 3 })
      expect(subscriber.limit).toBe(3)
    })

    it('应该自动添加到当前作用域', () => {
      const scope = new EffectScope()
      scope.run(() => {
        new Subscriber(callback)
        expect(scope.count).toBe(1)
      })
    })

    it('应该支持禁用作用域自动添加', () => {
      const scope = new EffectScope()
      scope.run(() => {
        new Subscriber(callback, { scope: false })
        expect(scope.count).toBe(0)
      })
    })
  })

  describe('触发机制', () => {
    it('trigger方法应该执行回调函数', () => {
      const subscriber = new Subscriber(callback)
      const args = ['arg1', 'arg2']
      subscriber.trigger(args, {})
      expect(callback).toHaveBeenCalledWith(args, {})
      expect(subscriber.count).toBe(1)
    })

    it('暂停状态下不应执行回调', () => {
      const subscriber = new Subscriber(callback)
      subscriber.pause()
      subscriber.trigger('test', {})
      expect(callback).not.toHaveBeenCalled()
      expect(subscriber.count).toBe(0)
    })

    it('销毁状态下不应执行回调', () => {
      const subscriber = new Subscriber(callback)
      subscriber.dispose()
      const result = subscriber.trigger('test', {})
      expect(callback).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('回调抛出错误时应该捕获并继续执行', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error')
      })
      const errorHandler = vi.fn()
      const subscriber = new Subscriber(errorCallback)
      subscriber.onError(errorHandler)

      subscriber.trigger('test', {})
      expect(errorCallback).toHaveBeenCalled()
      expect(errorHandler).toHaveBeenCalled()
      expect(subscriber.count).toBe(1)
    })
  })

  describe('计数限制', () => {
    it('达到限制次数后应该自动销毁', () => {
      const subscriber = new Subscriber(callback, { limit: 2 })

      subscriber.trigger('test1', {})
      expect(subscriber.count).toBe(1)
      expect(subscriber.isActive).toBe(true)

      subscriber.trigger('test2', {})
      expect(subscriber.count).toBe(2)
      expect(subscriber.isDeprecated).toBe(true)

      const result = subscriber.trigger('test3', {})
      expect(callback).toHaveBeenCalledTimes(2) // 只应该被调用两次
      expect(result).toBe(false)
    })

    it('resetCount方法应该重置计数', () => {
      const subscriber = new Subscriber(callback, { limit: 2 })

      subscriber.trigger('test', {})
      expect(subscriber.count).toBe(1)

      subscriber.resetCount()
      expect(subscriber.count).toBe(0)

      // 重置后应该可以再次触发
      subscriber.trigger('test', {})
      subscriber.trigger('test', {})
      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('销毁状态下不应重置计数', () => {
      const subscriber = new Subscriber(callback)
      subscriber.trigger('test', {})
      subscriber.dispose()

      const result = subscriber.resetCount()
      expect(result).toBe(false)
      expect(subscriber.count).toBe(1)
    })
  })

  describe('生命周期管理', () => {
    it('dispose方法应该清理回调引用', () => {
      const subscriber = new Subscriber(callback)
      subscriber.dispose()

      // 验证回调被清理
      subscriber.trigger('test', {})
      expect(callback).not.toHaveBeenCalled()
    })

    it('onCleanup方法应该注册清理回调', () => {
      const cleanupFn = vi.fn()
      const subscriber = new Subscriber(callback)

      subscriber.onCleanup(cleanupFn)
      subscriber.dispose()

      expect(cleanupFn).toHaveBeenCalled()
    })
  })
})
