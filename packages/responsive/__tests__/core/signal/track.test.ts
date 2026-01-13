import { describe, expect, it, vi } from 'vitest'
import {
  getActiveEffect,
  hasLinkedSignal,
  isTrackingPaused,
  peekSignal,
  ref,
  trackEffectDeps,
  trackSignal,
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

      const fn = () => peekSignal(signal, 'value')
      const value = trackEffectDeps(fn)
      expect(hasLinkedSignal(fn)).toBe(false)
      expect(value).toBe(42)
    })
  })

  describe('trackEffectDeps', () => {
    it('should set and reset active effect', async () => {
      const effect = {
        run: vi.fn(),
        [(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]: 1
      }

      let capturedEffect
      const result = trackEffectDeps(() => {
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

      trackEffectDeps(() => 'test', effect as any)

      // Version should be incremented
      expect(effect[(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]).toBe(2)
    })

    it('should handle effects without initial version', async () => {
      const effect = {
        run: vi.fn()
        // No initial version
      }

      trackEffectDeps(() => 'test', effect as any)

      // Version should be set to 1
      expect(
        (effect as any)[(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]
      ).toBe(1)
    })
  })

  describe('trackSignal', () => {
    it('should call track handler when there is an active effect', async () => {
      const signal = ref(42)
      const effect = vi.fn()

      trackEffectDeps(() => {
        trackSignal(signal, 'get', { key: 'test' })
      }, effect)

      expect(hasLinkedSignal(effect)).toBe(true)
    })
  })
})
