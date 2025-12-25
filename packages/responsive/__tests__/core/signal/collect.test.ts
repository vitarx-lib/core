import { describe, expect, it, vi } from 'vitest'
import {
  collectSignal,
  getActiveEffect,
  isTrackingPaused,
  peekSignal,
  ref,
  withSuspendedTracking
} from '../../../src/index.js'

describe('depend/collect', () => {
  describe('getActiveEffect', () => {
    it('should return null when no active effect', () => {
      expect(getActiveEffect()).toBeNull()
    })
  })

  describe('isTrackingPaused', () => {
    it('should return false by default', () => {
      expect(isTrackingPaused()).toBe(false)
    })
  })

  describe('withSuspendedTracking', () => {
    it('should temporarily suspend tracking', () => {
      expect(isTrackingPaused()).toBe(false)

      const result = withSuspendedTracking(() => {
        expect(isTrackingPaused()).toBe(true)
        return 'test-result'
      })

      expect(result).toBe('test-result')
      expect(isTrackingPaused()).toBe(false)
    })

    it('should restore tracking state even if function throws', () => {
      expect(isTrackingPaused()).toBe(false)

      expect(() => {
        withSuspendedTracking(() => {
          expect(isTrackingPaused()).toBe(true)
          throw new Error('test error')
        })
      }).toThrow('test error')

      expect(isTrackingPaused()).toBe(false)
    })
  })

  describe('peekSignal', () => {
    it('should read signal value without tracking', async () => {
      const signal = ref(42)

      // Mock isTrackingPaused to verify it's called
      const collectModule = await import('../../../src/core/signal/collect.js')
      const isTrackingPausedSpy = vi.spyOn(collectModule, 'isTrackingPaused')

      const value = peekSignal(signal, 'value')

      expect(value).toBe(42)
      // Verify tracking was suspended during peek
      expect(isTrackingPausedSpy).toHaveBeenCalled()
    })
  })

  describe('collectSignal', () => {
    it('should set and reset active effect', async () => {
      const effect = {
        run: vi.fn(),
        [(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]: 1
      }

      let capturedEffect
      const result = collectSignal(() => {
        capturedEffect = getActiveEffect()
        return 'test-result'
      }, effect as any)

      expect(result).toBe('test-result')
      expect(capturedEffect).toBe(effect)
      expect(getActiveEffect()).toBeNull()
    })

    it('should increment effect version', async () => {
      const effect = {
        run: vi.fn(),
        [(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]: 1
      }

      collectSignal(() => 'test', effect as any)

      // Version should be incremented
      expect(effect[(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]).toBe(2)
    })

    it('should handle effects without initial version', async () => {
      const effect = {
        run: vi.fn()
        // No initial version
      }

      collectSignal(() => 'test', effect as any)

      // Version should be set to 1
      expect(
        (effect as any)[(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]
      ).toBe(1)
    })
  })
})
