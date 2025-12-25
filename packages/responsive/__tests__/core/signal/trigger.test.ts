import { describe, expect, it, vi } from 'vitest'
import { SIGNAL_DEP_HEAD } from '../../../src/core/signal/symbol.js'
import { ref, triggerSignal } from '../../../src/index.js'

describe('depend/trigger', () => {
  describe('triggerSignal', () => {
    it('should trigger all dependent effects', () => {
      const signal = ref(42)

      // Create mock effects
      const effect1 = { run: vi.fn() }
      const effect2 = { run: vi.fn() }

      // Mock the signal's dependency head to point to our mock effects
      // We'll simulate the linked list structure
      const mockLink1 = {
        effect: effect1,
        sigNext: null // No next link
      }

      // Set up the signal's dependency head
      ;(signal as any)[SIGNAL_DEP_HEAD] = {
        effect: effect2,
        sigNext: mockLink1 // Point to first link
      }

      triggerSignal(signal, 'set')

      // Both effects should have been run
      expect(effect1.run).toHaveBeenCalled()
      expect(effect2.run).toHaveBeenCalled()
    })

    it('should call triggerOnTrigger in dev mode', async () => {
      const signal = ref(42)

      // Create mock effect
      const effect = { run: vi.fn() }

      // Mock the linked list

      ;(signal as any)[SIGNAL_DEP_HEAD] = {
        effect,
        sigNext: null
      }

      // Mock triggerOnTrigger for dev environment
      const debugModule = await import('../../../src/core/signal/debug.js')
      const triggerOnTriggerSpy = vi
        .spyOn(debugModule, 'triggerOnTrigger')
        .mockImplementation(() => {})

      triggerSignal(signal, 'set', { key: 'test' })

      // In dev mode, triggerOnTrigger should be called
      if ((globalThis as any).__DEV__) {
        expect(triggerOnTriggerSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            effect,
            signal,
            type: 'set',
            key: 'test'
          })
        )
      }

      // Effect should still be run
      expect(effect.run).toHaveBeenCalled()
    })

    it('should handle signal with no dependencies', () => {
      const signal = ref(42)

      // Ensure signal has no dependencies
      ;(signal as any)[SIGNAL_DEP_HEAD] = undefined

      // This should not throw
      expect(() => {
        triggerSignal(signal, 'set')
      }).not.toThrow()
    })
  })
})
