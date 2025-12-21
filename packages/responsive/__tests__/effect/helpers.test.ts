import { describe, expect, it, vi } from 'vitest'
import { ACTIVE_SCOPE } from '../../src/effect/symbol.js'
import {
  addToActiveScope,
  Context,
  createScope,
  EffectScope,
  getActiveScope,
  getOwnerScope,
  removeFromOwnerScope,
  reportEffectError
} from '../../src/index.js'

describe('effect/helpers', () => {
  describe('createScope', () => {
    it('should create a new EffectScope instance', () => {
      const scope = createScope()
      expect(scope).toBeInstanceOf(EffectScope)
    })

    it('should create a new EffectScope instance with options', () => {
      const scope = createScope({ name: 'test' })
      expect(scope).toBeInstanceOf(EffectScope)
      expect(scope.name).toBe('test')
    })
  })

  describe('getActiveScope', () => {
    it('should return the active scope from context', () => {
      const scope = new EffectScope()
      Context.run(ACTIVE_SCOPE, scope, () => {
        expect(getActiveScope()).toBe(scope)
      })
    })

    it('should return undefined when no active scope', () => {
      expect(getActiveScope()).toBeUndefined()
    })
  })

  describe('getOwnerScope', () => {
    it('should return the owner scope of an effect', () => {
      const scope = new EffectScope()
      const effect = {
        run: vi.fn(),
        state: 'active'
      }

      // Add effect to scope to establish ownership
      scope.add(effect as any)
      expect(getOwnerScope(effect as any)).toBe(scope)
    })

    it('should return undefined when effect has no owner scope', () => {
      const effect = {
        run: vi.fn(),
        state: 'active'
      }
      expect(getOwnerScope(effect as any)).toBeUndefined()
    })
  })

  describe('addToActiveScope', () => {
    it('should add effect to active scope', () => {
      const scope = new EffectScope()
      const addSpy = vi.spyOn(scope, 'add')
      const effect = { run: vi.fn(), state: 'active' }

      Context.run(ACTIVE_SCOPE, scope, () => {
        addToActiveScope(effect as any)
        expect(addSpy).toHaveBeenCalledWith(effect)
      })
    })

    it('should not add effect when no active scope', () => {
      const effect = { run: vi.fn(), state: 'active' }
      // Should not throw or error
      expect(() => addToActiveScope(effect as any)).not.toThrow()
    })
  })

  describe('removeFromOwnerScope', () => {
    it('should remove effect from owner scope', () => {
      const scope = new EffectScope()
      const removeSpy = vi.spyOn(scope, 'remove')
      const effect = {
        run: vi.fn(),
        state: 'active'
      }

      // Add effect to scope first to establish ownership
      scope.add(effect as any)
      removeFromOwnerScope(effect as any)
      expect(removeSpy).toHaveBeenCalledWith(effect)
    })

    it('should not remove effect when no owner scope', () => {
      const effect = { run: vi.fn(), state: 'active' }
      // Should not throw or error
      expect(() => removeFromOwnerScope(effect as any)).not.toThrow()
    })
  })

  describe('reportEffectError', () => {
    it('should delegate to owner scope handleError when owner scope exists', () => {
      const scope = new EffectScope()
      const handleErrorSpy = vi.spyOn(scope, 'handleError').mockImplementation(() => {})
      const error = new Error('Test error')
      const effect = {
        run: vi.fn(),
        state: 'active'
      }

      // Add effect to scope to establish ownership
      scope.add(effect as any)
      reportEffectError(effect as any, error, 'test-source')
      expect(handleErrorSpy).toHaveBeenCalledWith(error, 'test-source')
    })

    it('should throw error when no owner scope', () => {
      const error = new Error('Test error')
      const effect = { run: vi.fn(), state: 'active' }

      expect(() => reportEffectError(effect as any, error, 'test-source')).toThrow('Test error')
    })
  })
})
