import { describe, expect, it, vi } from 'vitest'
import { Effect, EffectScope } from '../../../src/index.js'

describe('effect/effect', () => {
  describe('Effect', () => {
    class TestEffect extends Effect {}

    it('should initialize with active state', () => {
      const effect = new TestEffect()
      expect(effect.state).toBe('active')
      expect(effect.state === 'active').toBe(true)
      expect(effect.state === 'paused').toBe(false)
      expect(effect.state === 'disposed').toBe(false)
    })

    it('should be added to active scope when scope option is true', () => {
      const scope = new EffectScope()
      let effect: TestEffect | undefined
      scope.run(() => {
        effect = new TestEffect()
      })
      // The effect should be added to the active scope
      expect(scope.effects.length).toBe(1)
      expect(scope.effects[0]).toBe(effect)
    })

    it('should be added to specified scope when scope option is an EffectScope', () => {
      const scope = new EffectScope()
      const effect = new TestEffect(scope)
      // The effect should be added to the specified scope
      expect(scope.effects.length).toBe(1)
      expect(scope.effects[0]).toBe(effect)
    })

    it('should not be added to any scope when scope option is false', () => {
      const scope = new EffectScope()
      scope.run(() => {
        const effect = new TestEffect(false)
        // The effect should not be added to any scope
        expect(scope.effects.length).toBe(0)
      })
    })

    it('should dispose correctly', () => {
      const effect = new TestEffect()
      expect(effect.state).toBe('active')

      effect.dispose()
      expect(effect.state).toBe('disposed')
      expect(effect.state).toBe('disposed')
    })

    it('should throw error when disposing already disposed effect', () => {
      const effect = new TestEffect()
      effect.dispose()

      expect(() => {
        effect.dispose()
      }).toThrow('Effect is already disposed.')
    })

    it('should pause and resume correctly', () => {
      const effect = new TestEffect()
      expect(effect.state).toBe('active')

      effect.pause()
      expect(effect.state).toBe('paused')
      expect(effect.state).toBe('paused')

      effect.resume()
      expect(effect.state).toBe('active')
      expect(effect.state === 'active').toBe(true)
    })

    it('should throw error when pausing non-active effect', () => {
      const effect = new TestEffect()
      effect.pause()

      expect(() => {
        effect.pause()
      }).toThrow('Effect must be active to pause.')
    })

    it('should throw error when resuming non-paused effect', () => {
      const effect = new TestEffect()

      expect(() => {
        effect.resume()
      }).toThrow('Effect must be paused to resume.')
    })

    it('should call lifecycle hooks', () => {
      const beforeDisposeSpy = vi.fn()
      const afterDisposeSpy = vi.fn()
      const beforePauseSpy = vi.fn()
      const afterPauseSpy = vi.fn()
      const beforeResumeSpy = vi.fn()
      const afterResumeSpy = vi.fn()

      class TestEffectWithHooks extends Effect {
        protected override beforeDispose = beforeDisposeSpy
        protected override afterDispose = afterDisposeSpy
        protected override beforePause = beforePauseSpy
        protected override afterPause = afterPauseSpy
        protected override beforeResume = beforeResumeSpy
        protected override afterResume = afterResumeSpy
      }

      const effect = new TestEffectWithHooks()

      effect.pause()
      expect(beforePauseSpy).toHaveBeenCalled()
      expect(afterPauseSpy).toHaveBeenCalled()

      effect.resume()
      expect(beforeResumeSpy).toHaveBeenCalled()
      expect(afterResumeSpy).toHaveBeenCalled()

      effect.dispose()
      expect(beforeDisposeSpy).toHaveBeenCalled()
      expect(afterDisposeSpy).toHaveBeenCalled()
    })
  })
})
