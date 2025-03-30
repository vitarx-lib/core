import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Effect, isEffect } from '../../src/effect'

describe('Effect', () => {
  let effect: Effect

  beforeEach(() => {
    effect = new Effect()
  })

  describe('状态属性', () => {
    it('初始状态应该为active', () => {
      expect(effect.state).toBe('active')
      expect(effect.isActive).toBe(true)
      expect(effect.isPaused).toBe(false)
      expect(effect.isDeprecated).toBe(false)
    })

    it('getState方法应该返回当前状态', () => {
      expect(effect.getState()).toBe('active')
    })
  })

  describe('dispose方法', () => {
    it('应该将状态设置为deprecated', () => {
      effect.dispose()
      expect(effect.state).toBe('deprecated')
      expect(effect.isDeprecated).toBe(true)
    })

    it('重复调用dispose不应产生影响', () => {
      effect.dispose()
      effect.dispose()
      expect(effect.state).toBe('deprecated')
    })

    it('应该触发dispose回调', () => {
      const callback = vi.fn()
      effect.onDispose(callback)
      effect.dispose()
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('pause和resume方法', () => {
    it('pause应该将状态设置为paused', () => {
      effect.pause()
      expect(effect.state).toBe('paused')
      expect(effect.isPaused).toBe(true)
    })

    it('resume应该将状态从paused恢复为active', () => {
      effect.pause()
      effect.resume()
      expect(effect.state).toBe('active')
      expect(effect.isActive).toBe(true)
    })

    it('非active状态下调用pause应该抛出错误', () => {
      effect.dispose()
      expect(() => effect.pause()).toThrow('Effect must be active to pause.')
    })

    it('非paused状态下调用resume应该抛出错误', () => {
      expect(() => effect.resume()).toThrow('Effect must be paused to resume.')
    })

    it('应该触发pause和resume回调', () => {
      const pauseCallback = vi.fn()
      const resumeCallback = vi.fn()
      effect.onPause(pauseCallback)
      effect.onResume(resumeCallback)

      effect.pause()
      expect(pauseCallback).toHaveBeenCalled()

      effect.resume()
      expect(resumeCallback).toHaveBeenCalled()
    })
  })

  describe('错误处理', () => {
    it('回调函数抛出错误时应该触发error回调', () => {
      const error = new Error('Test error')
      const errorCallback = vi.fn()
      effect.onError(errorCallback)

      const disposeCb = () => {
        throw error
      }
      effect.onDispose(disposeCb)
      effect.dispose()

      expect(errorCallback).toHaveBeenCalledWith(error, 'dispose')
    })

    it('deprecated状态下添加回调应该抛出错误', () => {
      effect.dispose()
      expect(() => effect.onDispose(() => {})).toThrow(
        'Cannot add callback to a deprecated effect.'
      )
    })

    it('添加非函数回调应该抛出错误', () => {
      expect(() => effect.onDispose('not a function' as any)).toThrow(
        'Callback parameter for "dispose" must be a function.'
      )
    })
  })

  describe('isEffect函数', () => {
    it('应该正确识别Effect实例', () => {
      expect(isEffect(effect)).toBe(true)
      expect(isEffect({})).toBe(false)
      expect(isEffect(null)).toBe(false)
    })

    it('应该识别类Effect接口的对象', () => {
      const effectLike = {
        dispose: () => {},
        onDispose: () => {},
        pause: () => {},
        onPause: () => {},
        resume: () => {},
        onResume: () => {},
        onError: () => {},
        getState: () => 'active' as const
      }
      expect(isEffect(effectLike)).toBe(true)
    })
  })
})
