import { describe, expect, it, vi } from 'vitest'
import { DEP_VERSION } from '../../../src/core/signal/symbol.js'
import {
  getActiveEffect,
  hasLinkedSignal,
  hasPropTrack,
  hasTrack,
  reactive,
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
    it('should set and reset active effect', () => {
      const effect = {
        run: vi.fn(),
        [DEP_VERSION]: 1
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

    it('should increment effect version', () => {
      const effect = {
        run: vi.fn(),
        [DEP_VERSION]: 1
      }

      trackEffect(() => 'test', effect as any)

      // Version should be incremented
      expect(effect[DEP_VERSION]).toBe(2)
    })

    it('should handle effects without initial version', () => {
      const effect = {
        run: vi.fn()
        // No initial version
      }

      trackEffect(() => 'test', effect as any)

      // Version should be set to 1
      expect((effect as any)[DEP_VERSION]).toBe(1)
    })
  })

  describe('trackSignal', () => {
    it('should call track handler when there is an active effect', () => {
      const signal = ref(42)
      const effect = vi.fn()

      trackEffect(() => {
        trackSignal(signal, 'get', { key: 'test' })
      }, effect)

      expect(hasLinkedSignal(effect)).toBe(true)
    })
  })
  describe('hasTrack', () => {
    it('should return true if there is an get ref', () => {
      const signal = ref(42)
      const fn = () => signal.value

      expect(hasTrack(fn)).toBe(true)
    })
    it('should return false if there is no get ref', () => {
      const fn = () => null
      expect(hasTrack(fn)).toBe(false)
    })
    it('should return true if there is an get reactive prop', async () => {
      const obj = reactive({ a: 1 })
      const fn = () => obj.a

      expect(hasTrack(fn)).toBe(true)
    })
  })
  describe('hasPropTrack', () => {
    it('should return true if there is an get reactive prop', () => {
      const obj = reactive({ a: 1 })
      expect(hasPropTrack(obj, 'a')).toBe(true)
    })

    it('should return false if there is no get reactive prop', () => {
      const obj = { a: 1 }
      expect(hasPropTrack(obj, 'a')).toBe(false)
    })
  })
})
