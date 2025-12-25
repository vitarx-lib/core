import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { Computed, ref } from '../../../src/index.js'

describe('signal/computed/computed', () => {
  describe('constructor', () => {
    it('should create a Computed instance', () => {
      const getter = vi.fn(() => 42)
      const computed = new Computed(getter)

      expect(computed).toBeInstanceOf(Computed)
      expect(computed.dirty).toBe(true)
    })

    it('should accept options', () => {
      const getter = vi.fn(() => 42)
      const setter = vi.fn()
      const options = { setter, immediate: true }
      const computed = new Computed(getter, options)

      expect(computed).toBeInstanceOf(Computed)
    })
  })

  describe('value', () => {
    it('should compute value when accessed', () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)

      expect(computed.value).toBe(0)
      expect(computed.dirty).toBe(false)

      source.value = 2
      expect(computed.dirty).toBe(true)
      expect(computed.value).toBe(4)
      expect(computed.dirty).toBe(false)
    })

    it('should track access to value', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      const trackSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'trackSignal'
      )

      computed.value

      expect(trackSignalSpy).toHaveBeenCalledWith(computed, 'get')
    })
  })

  describe('setter', () => {
    it('should call setter when provided', () => {
      const source = ref(0)
      const setter = vi.fn(newValue => {
        source.value = newValue / 2
      })
      const computed = new Computed(() => source.value * 2, { setter })

      computed.value = 10

      expect(setter).toHaveBeenCalledWith(10)
      expect(source.value).toBe(5)
    })

    it('should warn when setting value without setter', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const computed = new Computed(() => 42)

      computed.value = 10

      expect(warnSpy).toHaveBeenCalledWith(
        'Computed properties should not be modified directly unless a setter function is defined.'
      )
      warnSpy.mockRestore()
    })
  })

  describe('run', () => {
    it('should mark as dirty and trigger signal when not already dirty', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      // Access value to make it not dirty
      const _ = computed.value
      expect(computed.dirty).toBe(false)

      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      computed.run()

      expect(computed.dirty).toBe(true)
      expect(triggerSignalSpy).toHaveBeenCalledWith(computed, 'dirty')
    })

    it('should not trigger signal when already dirty', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      expect(computed.dirty).toBe(true)

      const triggerSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'triggerSignal'
      )

      computed.run()

      expect(computed.dirty).toBe(true)
      expect(triggerSignalSpy).not.toHaveBeenCalled()
    })
  })

  describe('toString', () => {
    it('should return string representation of value', () => {
      const computed = new Computed(() => 42)
      expect(computed.toString()).toBe('42')
    })

    it('should return object representation for complex values', () => {
      const computed = new Computed(() => ({ a: 1 }))
      expect(computed.toString()).toBe('[object Object]')
    })
  })

  describe('Symbol.toPrimitive', () => {
    it('should return value for number hint', () => {
      const computed = new Computed(() => 42)
      expect(+computed).toBe(42)
    })

    it('should return string representation for string hint', () => {
      const computed = new Computed(() => 42)
      expect(`${computed}`).toBe('42')
    })

    it('should return value for default hint', () => {
      const computed = new Computed(() => 42)
      expect(computed[Symbol.toPrimitive]('default')).toBe(42)
    })
  })

  describe('recomputed', () => {
    it('should collect dependencies during computation', async () => {
      const source = ref(0)
      const computed = new Computed(() => source.value * 2)
      const collectSignalSpy = vi.spyOn(
        await import('../../../src/core/signal/index.js'),
        'collectSignal'
      )

      // Access value to trigger recomputation
      const _ = computed.value

      expect(collectSignalSpy).toHaveBeenCalled()
    })

    it('should report error when getter throws', () => {
      const error = new Error('Test error')
      const getter = vi.fn(() => {
        throw error
      })
      const computed = new Computed(getter)
      const reportErrorSpy = vi.spyOn(computed as any, 'reportError').mockImplementation(() => {})

      // Access value to trigger recomputation
      const _ = computed.value

      expect(reportErrorSpy).toHaveBeenCalledWith(error, 'computed.getter')
    })
  })
})
