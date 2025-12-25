import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { IS_REF, IS_SIGNAL, ValueRef } from '../../../src/index.js'

describe('signals/ref/value', () => {
  describe('constructor', () => {
    it('should create a Ref instance', () => {
      const ref = new ValueRef(42)

      expect(ref).toBeInstanceOf(ValueRef)
      expect(ref[IS_SIGNAL]).toBe(true)
      expect(ref[IS_REF]).toBe(true)
    })

    it('should warn when creating ref from another ref in development mode', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const originalRef = new ValueRef(42)
      new ValueRef(originalRef)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Ref] Creating a ref from another ref is not recommended as it creates unnecessary nesting. Consider using the original ref directly.'
      )
      warnSpy.mockRestore()
    })
  })

  describe('value', () => {
    it('should get value and track dependencies', async () => {
      const ref = new ValueRef(42)
      const trackSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackSignal'
      )

      const value = ref.value

      expect(value).toBe(42)
      expect(trackSignalSpy).toHaveBeenCalledWith(ref, 'get', { key: 'value' })
    })

    it('should set value and trigger updates', async () => {
      const ref = new ValueRef(0)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      ref.value = 42

      expect(ref.value).toBe(42)
      expect(triggerSignalSpy).toHaveBeenCalledWith(ref, 'set', {
        key: 'value',
        oldValue: 0,
        newValue: 42
      })
    })

    it('should not trigger updates when setting same value', async () => {
      const ref = new ValueRef(42)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      ref.value = 42

      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })
})
