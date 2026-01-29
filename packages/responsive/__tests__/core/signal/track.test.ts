import { describe, expect, it, vi } from 'vitest'
import {
  getActiveEffect,
  hasLinkedSignal,
  ref,
  trackEffect,
  trackSignal
} from '../../../src/index.js'

describe('depend/track', () => {
  describe('getActiveEffect', () => {
    it('should return null when no active effect', () => {
      expect(getActiveEffect()).toBeNull()
    })
  })

  describe('trackEffectDeps', () => {
    it('should set and reset active effect', async () => {
      const effect = {
        run: vi.fn(),
        [(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]: 1
      }

      let capturedEffect
      const result = trackEffect(() => {
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

      trackEffect(() => 'test', effect as any)

      // Version should be incremented
      expect(effect[(await import('../../../src/core/signal/symbol.js')).DEP_VERSION]).toBe(2)
    })

    it('should handle effects without initial version', async () => {
      const effect = {
        run: vi.fn()
        // No initial version
      }

      trackEffect(() => 'test', effect as any)

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

      trackEffect(() => {
        trackSignal(signal, 'get', { key: 'test' })
      }, effect)

      expect(hasLinkedSignal(effect)).toBe(true)
    })
  })
})
