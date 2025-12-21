import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { IS_REF, IS_SIGNAL, Ref } from '../../../src/index.js'

describe('signal/ref/impl', () => {
  describe('constructor', () => {
    it('should create a Ref instance', () => {
      const ref = new Ref(42, true)

      expect(ref).toBeInstanceOf(Ref)
      expect(ref[IS_SIGNAL]).toBe(true)
      expect(ref[IS_REF]).toBe(true)
      expect(ref.deep).toBe(true)
    })

    it('should warn when creating ref from another ref in development mode', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const originalRef = new Ref(42, true)
      new Ref(originalRef, true)

      expect(warnSpy).toHaveBeenCalledWith(
        '[Ref] Creating a ref from another ref is not recommended as it creates unnecessary nesting. Consider using the original ref directly.'
      )
      warnSpy.mockRestore()
    })
  })

  describe('value', () => {
    it('should get value and track dependencies', async () => {
      const ref = new Ref(42, true)
      const trackSignalSpy = vi.spyOn(await import('../../../src/depend/index.js'), 'trackSignal')

      const value = ref.value

      expect(value).toBe(42)
      expect(trackSignalSpy).toHaveBeenCalledWith(ref, 'get', { key: 'value' })
    })

    it('should set value and trigger updates', async () => {
      const ref = new Ref(0, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/depend/index.js'),
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
      const ref = new Ref(42, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/depend/index.js'),
        'triggerSignal'
      )

      ref.value = 42

      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('trigger', () => {
    it('should trigger signal update', async () => {
      const ref = new Ref(42, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/depend/index.js'),
        'triggerSignal'
      )

      ref.trigger()

      expect(triggerSignalSpy).toHaveBeenCalledWith(ref, 'set', { key: 'value', newValue: 42 })
    })
  })

  describe('track', () => {
    it('should track signal access', async () => {
      const ref = new Ref(42, true)
      const trackSignalSpy = vi.spyOn(await import('../../../src/depend/index.js'), 'trackSignal')

      ref.track()

      expect(trackSignalSpy).toHaveBeenCalledWith(ref, 'get', { key: 'value' })
    })
  })

  describe('update', () => {
    it('should update value', async () => {
      const ref = new Ref(0, true)
      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/depend/index.js'),
        'triggerSignal'
      )

      ref.update(42)

      expect(ref.value).toBe(42)
      expect(triggerSignalSpy).toHaveBeenCalledWith(ref, 'set', {
        key: 'value',
        oldValue: 0,
        newValue: 42
      })
    })
  })
})
