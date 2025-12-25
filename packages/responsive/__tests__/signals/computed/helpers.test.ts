import { describe, expect, it, vi } from 'vitest'
import { computed, Computed, computedWithSetter, isComputed, ref } from '../../../src/index.js'

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
      const options = { setter, immediate: true }
      const computedInstance = computed(getter, options)

      expect(computedInstance).toBeInstanceOf(Computed)
    })

    it('should create a Computed instance with setter function', () => {
      const getter = vi.fn(() => 42)
      const setter = vi.fn()
      const computedInstance = computed(getter, setter)

      expect(computedInstance).toBeInstanceOf(Computed)
      // We can't easily verify the setter was set without accessing private members
    })

    it('should compute value correctly', () => {
      const source = ref(0)
      const computedInstance = computed(() => source.value * 2)

      expect(computedInstance.value).toBe(0)

      source.value = 2
      expect(computedInstance.value).toBe(4)
    })
  })

  describe('computedWithSetter', () => {
    it('should create a Computed instance with getter and setter', () => {
      const getter = vi.fn(() => 42)
      const setter = vi.fn()
      const computedInstance = computedWithSetter(getter, setter)

      expect(computedInstance).toBeInstanceOf(Computed)
    })

    it('should create a Computed instance with additional options', () => {
      const getter = vi.fn(() => 42)
      const setter = vi.fn()
      const options = { immediate: true }
      const computedInstance = computedWithSetter(getter, setter, options)

      expect(computedInstance).toBeInstanceOf(Computed)
    })

    it('should work with getter and setter', () => {
      const source = ref(0)
      const computedInstance = computedWithSetter(
        () => source.value * 2,
        newValue => {
          source.value = newValue / 2
        }
      )

      expect(computedInstance.value).toBe(0)

      computedInstance.value = 10
      expect(source.value).toBe(5)
      expect(computedInstance.value).toBe(10)
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
