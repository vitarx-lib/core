import { describe, expect, it, vi } from 'vitest'
import { ref } from '../../src/index.js'
import { EffectWatcher } from '../../src/watcher/effect.js'

describe('watcher/EffectWatcher', () => {
  describe('constructor', () => {
    it('should create an EffectWatcher instance', () => {
      const effect = vi.fn()
      const watcher = new EffectWatcher(effect, {})

      expect(watcher).toBeInstanceOf(EffectWatcher)
      expect(effect).toHaveBeenCalled()
    })

    it('should throw error when effect is not a function', () => {
      expect(() => {
        new EffectWatcher('not-a-function' as any, {})
      }).toThrow('[EffectWatcher] effect must be a function')
    })
  })

  describe('runEffect', () => {
    it('should execute effect and collect signals', () => {
      const signal = ref(42)
      const effect = vi.fn(() => {
        return signal.value
      })
      new EffectWatcher(effect, { flush: 'sync' })
      expect(effect).toHaveBeenCalled()
      signal.value++
      expect(effect).toHaveBeenCalledTimes(2)
    })

    it('should report error when effect throws', () => {
      const error = new Error('Test error')
      const effect = vi.fn(() => {
        throw error
      })
      // Mock reportError to avoid throwing the error
      const mockReportError = vi.fn()

      // Create a mock class that extends EffectWatcher to override reportError
      class TestEffectWatcher extends EffectWatcher<any> {
        protected override reportError(e: unknown, source: string) {
          mockReportError(e, source)
        }
      }

      // Create watcher with flush: 'sync' to avoid async issues
      new TestEffectWatcher(effect, { flush: 'sync' })

      // The error should have been reported during construction
      expect(mockReportError).toHaveBeenCalledWith(error, 'effect')
    })
  })
})
