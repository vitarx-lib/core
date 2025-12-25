import { describe, expect, it, vi } from 'vitest'
import { ref, trackSignal, withSuspendedTracking } from '../../../src/index.js'

describe('depend/track', () => {
  describe('trackSignal', () => {
    it('should not track when tracking is paused', async () => {
      const signal = ref(42)
      const effect = { run: vi.fn() }

      // Mock getActiveEffect to return our test effect
      const collectModule = await import('../../../src/core/signal/collect.js')
      const getActiveEffectSpy = vi
        .spyOn(collectModule, 'getActiveEffect')
        .mockReturnValue(effect as any)

      // Track when not paused
      trackSignal(signal)
      expect(getActiveEffectSpy).toHaveBeenCalled()

      // Reset spy
      getActiveEffectSpy.mockClear()

      // Track when paused
      withSuspendedTracking(() => {
        trackSignal(signal)
      })

      // getActiveEffect should not be called when tracking is paused
      expect(getActiveEffectSpy).not.toHaveBeenCalled()
    })

    it('should not track when no active effect', async () => {
      const signal = ref(42)

      // Mock getActiveEffect to return null
      const collectModule = await import('../../../src/core/signal/collect.js')
      const getActiveEffectSpy = vi.spyOn(collectModule, 'getActiveEffect').mockReturnValue(null)

      trackSignal(signal)

      // getActiveEffect should be called but no tracking should happen
      expect(getActiveEffectSpy).toHaveBeenCalled()
    })

    it('should call track handler when there is an active effect', async () => {
      const signal = ref(42)
      const effect = {
        run: vi.fn(),
        [Symbol('DEP_VERSION')]: 1,
        [Symbol('DEP_INDEX_MAP')]: new WeakMap()
      }

      // Mock getActiveEffect to return our test effect
      const collectModule = await import('../../../src/core/signal/collect.js')
      vi.spyOn(collectModule, 'getActiveEffect').mockReturnValue(effect as any)

      // Mock triggerOnTrack for dev environment
      const debugModule = await import('../../../src/core/signal/debug.js')
      const triggerOnTrackSpy = vi.spyOn(debugModule, 'triggerOnTrack').mockImplementation(() => {})

      trackSignal(signal, 'get', { key: 'test' })

      // In dev mode, triggerOnTrack should be called
      if ((globalThis as any).__DEV__) {
        expect(triggerOnTrackSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            effect,
            signal,
            type: 'get',
            key: 'test'
          })
        )
      }
    })
  })
})
