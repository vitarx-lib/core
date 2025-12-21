import { describe, expect, it, vi } from 'vitest'
import { signal } from '../../src/index.js'

describe('signal/callable', () => {
  describe('signal', () => {
    it('should create a callable signal with initial value', () => {
      const sig = signal(42)
      expect(sig()).toBe(42)
    })

    it('should create a callable signal without initial value', () => {
      const sig = signal()
      expect(sig()).toBeUndefined()
    })

    it('should update callable signal value', () => {
      const sig = signal(0)
      expect(sig()).toBe(0)

      sig(42)
      expect(sig()).toBe(42)
    })

    it('should track dependencies when getting value', async () => {
      const sig = signal(0)

      // Mock trackSignal to verify it's called
      const trackSignalSpy = vi.spyOn(await import('../../src/depend/index.js'), 'trackSignal')

      // Access value to trigger tracking
      const value = sig()
      expect(value).toBe(0)
      expect(trackSignalSpy).toHaveBeenCalledWith(sig, 'get')
    })

    it('should trigger updates when value changes', async () => {
      const sig = signal(0)

      // Mock triggerSignal to verify it's called on update
      const triggerSignalSpy = vi.spyOn(await import('../../src/depend/index.js'), 'triggerSignal')

      // Update value
      sig(42)
      expect(triggerSignalSpy).toHaveBeenCalledWith(
        sig,
        'set',
        expect.objectContaining({ oldValue: 0, newValue: 42 })
      )
    })

    it('should not trigger updates when value is the same', async () => {
      const sig = signal(42)

      // Mock triggerSignal to verify it's not called
      const triggerSignalSpy = vi.spyOn(await import('../../src/depend/index.js'), 'triggerSignal')

      // Set same value
      sig(42)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })
})
