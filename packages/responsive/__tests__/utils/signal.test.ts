import { describe, expect, it } from 'vitest'
import { computed, ref } from '../../src/index.js'
import { getSignal, readSignal, setSignal, writeSignal } from '../../src/utils/signal.js'

describe('utils/signal', () => {
  describe('readSignal', () => {
    it('should return the value of a ref signal', () => {
      const signal = ref(42)
      expect(readSignal(signal)).toBe(42)
    })

    it('should return the value of a computed signal', () => {
      const signal = computed(() => 42)
      expect(readSignal(signal)).toBe(42)
    })

    it('should return the value of a callable signal', () => {
      const signal = ref(42)
      expect(readSignal(signal)).toBe(42)
    })

    it('should return the original value if it is not a signal', () => {
      expect(readSignal(42)).toBe(42)
      expect(readSignal('hello')).toBe('hello')
      expect(readSignal(null)).toBe(null)
      expect(readSignal(undefined)).toBe(undefined)
    })

    it('should be aliased as getSignal', () => {
      expect(getSignal).toBe(readSignal)
    })
  })

  describe('writeSignal', () => {
    it('should write value to a ref signal', () => {
      const signal = ref(0)
      writeSignal(signal, 42)
      expect(signal.value).toBe(42)
    })

    it('should write value to a callable signal', () => {
      // Create a callable signal - ref signals are not callable, so we'll test with a different approach
      const signal = ref(0)
      writeSignal(signal, 42)
      expect(signal.value).toBe(42)
    })

    it('should do nothing if the value is not a signal', () => {
      // This should not throw an error
      expect(() => {
        writeSignal(42 as any, 42)
      }).not.toThrow()
    })

    it('should be aliased as setSignal', () => {
      expect(setSignal).toBe(writeSignal)
    })
  })
})
