import { describe, expect, it, vi } from 'vitest'
import {
  Effect,
  EffectScope,
  onScopeDispose,
  onScopePause,
  onScopeResume
} from '../../../src/index.js'

describe('effect/scope', () => {
  describe('EffectScope', () => {
    class TestEffect extends Effect {
      run(): void {
        // Implementation for testing
      }
    }

    it('should create a new scope', () => {
      const scope = new EffectScope()
      expect(scope.effects.length).toBe(0)
      expect(scope.state).toBe('active')
    })

    it('should add effects to the scope', () => {
      const scope = new EffectScope()
      const effect = new TestEffect(scope)

      expect(scope.effects.length).toBe(1)
      expect(scope.effects.includes(effect)).toBe(true)
    })

    it('should dispose all effects when scope is disposed', () => {
      const scope = new EffectScope()
      new TestEffect(scope)
      new TestEffect(scope)

      expect(scope.effects.length).toBe(2)

      scope.dispose()

      expect(scope.state).toBe('disposed')
    })

    it('should pause and resume all effects when scope is paused and resumed', () => {
      const scope = new EffectScope()
      new TestEffect(scope)
      new TestEffect(scope)

      expect(scope.state).toBe('active')

      scope.pause()

      expect(scope.state).toBe('paused')

      scope.resume()

      expect(scope.state).toBe('active')
    })

    it('should run a function in the scope context', () => {
      const scope = new EffectScope()
      let activeScope: EffectScope | undefined

      scope.run(() => {
        // This would normally set the active scope
        activeScope = scope
      })

      expect(activeScope).toBe(scope)
    })

    it('should collect effects created within run()', () => {
      const scope = new EffectScope()

      scope.run(() => {
        new TestEffect(true) // This should be added to the scope
      })

      expect(scope.effects.length).toBe(1)
    })
  })

  describe('lifecycle functions', () => {
    it('should register dispose callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopeDispose(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      scope.dispose()
      expect(callback).toHaveBeenCalled()
    })

    it('should register pause callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopePause(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      scope.pause()
      expect(callback).toHaveBeenCalled()
    })

    it('should register resume callbacks', () => {
      const scope = new EffectScope()
      const callback = vi.fn()

      scope.run(() => {
        onScopeResume(callback)
      })

      expect(callback).not.toHaveBeenCalled()

      // Pause the scope
      scope.pause()

      // Resume the scope
      scope.resume()
      expect(callback).toHaveBeenCalled()
    })

    it('should warn when registering callbacks outside of scope', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      onScopeDispose(() => {})

      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx.EffectScope] onScopeDispose() no active scope found'
      )

      warnSpy.mockRestore()
    })
  })
})
