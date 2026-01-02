import { describe, expect, it, vi } from 'vitest'
import { computed, Computed, isComputed, ref } from '../../../src/index.js'

describe('signal/computed/helpers', () => {
  describe('computed', () => {
    it('should create a Computed instance', () => {
      const getter = vi.fn(() => 42)
      const computedInstance = computed(getter)

      expect(computedInstance).toBeInstanceOf(Computed)
    })

    it('should create a Computed instance with options object', () => {
      const getter = vi.fn(() => 42)
      const setter = vi.fn()
      const computedInstance = computed({ get: getter, set: setter })

      expect(computedInstance).toBeInstanceOf(Computed)
    })

    it('should compute value correctly', () => {
      const source = ref(0)
      const computedInstance = computed(() => source.value * 2)

      expect(computedInstance.value).toBe(0)

      source.value = 2
      expect(computedInstance.value).toBe(4)
    })
  })

  describe('isComputed', () => {
    it('should return true for Computed instances', () => {
      const computedInstance = computed(() => 42)

      expect(isComputed(computedInstance)).toBe(true)
    })

    it('should return false for non-Computed values', () => {
      const refInstance = ref(42)

      expect(isComputed(refInstance)).toBe(false)
      expect(isComputed(42)).toBe(false)
      expect(isComputed({})).toBe(false)
      expect(isComputed(null)).toBe(false)
    })
  })
})
