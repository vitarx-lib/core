import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addEffect, createScope, Effect, EffectScope, getCurrentScope } from '../../src/index'

describe('EffectScope', () => {
  let scope: EffectScope

  beforeEach(() => {
    scope = new EffectScope()
  })

  describe('基础功能', () => {
    it('应该正确创建作用域实例', () => {
      expect(scope).toBeInstanceOf(EffectScope)
      expect(scope.name).toBe('anonymous')
      expect(scope.count).toBe(0)
    })

    it('应该支持自定义配置', () => {
      const errorHandler = vi.fn()
      const customScope = new EffectScope({
        name: 'custom',
        errorHandler
      })
      expect(customScope.name).toBe('custom')
      expect(customScope.config.errorHandler).toBe(errorHandler)
    })

    it('errorHandler必须是函数类型', () => {
      expect(() => new EffectScope({ errorHandler: 'not a function' as any })).toThrow(
        '[Vitarx.EffectScope]: The errorHandler must be a function type'
      )
    })
  })

  describe('副作用管理', () => {
    let effect: Effect

    beforeEach(() => {
      effect = new Effect()
    })

    it('应该能够添加和管理副作用', () => {
      expect(scope.addEffect(effect).count).toBe(1)
    })

    it('添加非Effect对象应该抛出错误', () => {
      expect(() => scope.addEffect({} as any)).toThrow(TypeError)
    })

    it('销毁后不应该再添加副作用', () => {
      scope.dispose()
      expect(() => scope.addEffect(effect)).toThrow(
        '[Vitarx.EffectScope]: Cannot add effects to a destroyed scope'
      )
    })

    it('作用域销毁时应该清理所有副作用', () => {
      scope.addEffect(effect)
      scope.dispose()
      expect(effect.isDeprecated).toBe(true)
      expect(scope.count).toBe(0)
    })
  })

  describe('生命周期管理', () => {
    let effect1: Effect
    let effect2: Effect

    beforeEach(() => {
      effect1 = new Effect()
      effect2 = new Effect()
      scope.addEffect(effect1)
      scope.addEffect(effect2)
    })

    it('暂停作用域应该暂停所有副作用', () => {
      scope.pause()
      expect(effect1.isPaused).toBe(true)
      expect(effect2.isPaused).toBe(true)
    })

    it('恢复作用域应该恢复所有副作用', () => {
      scope.pause()
      scope.resume()
      expect(effect1.isActive).toBe(true)
      expect(effect2.isActive).toBe(true)
    })

    it('销毁作用域应该清理所有资源', () => {
      scope.dispose()
      expect(scope.isDeprecated).toBe(true)
      expect(scope.count).toBe(0)
      expect(scope.config.errorHandler).toBeNull()
    })
  })

  describe('错误处理', () => {
    it('作用域的errorHandler应该处理副作用的错误', () => {
      const errorHandler = vi.fn()
      const errorScope = new EffectScope({ errorHandler })
      const effect = new Effect()

      errorScope.addEffect(effect)
      effect.onDispose(() => {
        throw new Error('Test error')
      })

      errorScope.dispose()
      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('作用域上下文', () => {
    it('getCurrentScope应该返回当前上下文的作用域', () => {
      expect(getCurrentScope()).toBeUndefined()

      const result = scope.run(() => {
        expect(getCurrentScope()).toBe(scope)
        return true
      })

      expect(result).toBe(true)
      expect(getCurrentScope()).toBeUndefined()
    })

    it('attachToCurrentScope选项应该自动附加到父作用域', () => {
      const parentScope = new EffectScope()

      parentScope.run(() => {
        new EffectScope({ attachToCurrentScope: true })
        expect(parentScope.count).toBe(1)
      })
    })
  })

  describe('工具函数', () => {
    it('createScope应该创建新的作用域实例', () => {
      const scope = createScope({ name: 'test' })
      expect(scope).toBeInstanceOf(EffectScope)
      expect(scope.name).toBe('test')
    })

    it('addEffect应该将副作用添加到当前作用域', () => {
      const effect = new Effect()

      expect(addEffect(effect)).toBe(false) // 无当前作用域

      scope.run(() => {
        expect(addEffect(effect)).toBe(true)
        expect(scope.count).toBe(1)
      })
    })
  })
})
