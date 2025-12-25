import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, computedWithSetter, isComputed, ref } from '../../src/index.js'

describe('signal/computed', () => {
  describe('computed', () => {
    it('should create a computed property with getter', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2)

      expect(double.value).toBe(0)

      count.value = 2
      expect(double.value).toBe(4)
    })

    it('should support lazy evaluation', () => {
      const count = ref(0)
      const getter = vi.fn(() => count.value * 2)
      const double = computed(getter)

      // Getter should not be called immediately
      expect(getter).not.toHaveBeenCalled()

      // Accessing value should call getter
      expect(double.value).toBe(0)
      expect(getter).toHaveBeenCalledTimes(1)

      // Accessing again should not call getter (cached)
      expect(double.value).toBe(0)
      expect(getter).toHaveBeenCalledTimes(1)

      // Changing dependency should invalidate cache
      count.value = 2
      expect(double.value).toBe(4)
      expect(getter).toHaveBeenCalledTimes(2)
    })

    it('should support setter', () => {
      const count = ref(0)
      const double = computed(
        () => count.value * 2,
        newValue => {
          count.value = newValue / 2
        }
      )

      expect(double.value).toBe(0)

      // Setting value should call setter
      double.value = 10
      expect(count.value).toBe(5)
      expect(double.value).toBe(10)
    })

    it('should support immediate option', () => {
      const count = ref(0)
      const getter = vi.fn(() => count.value * 2)
      const double = computed(getter, { immediate: true })

      // Getter should be called immediately
      expect(getter).toHaveBeenCalledTimes(1)
      expect(double.value).toBe(0)

      // Accessing again should not call getter (cached)
      expect(double.value).toBe(0)
      expect(getter).toHaveBeenCalledTimes(1)
    })

    it('should warn when setting value without setter', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2)

      // Mock logger.warn
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      // Setting value should trigger warning
      double.value = 10

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalledWith(
        'Computed properties should not be modified directly unless a setter function is defined.'
      )

      // Restore logger
      warnSpy.mockRestore()
    })
  })

  describe('computedWithSetter', () => {
    it('should create a computed property with getter and setter', () => {
      const count = ref(0)
      const double = computedWithSetter(
        () => count.value * 2,
        newValue => {
          count.value = newValue / 2
        }
      )

      expect(double.value).toBe(0)

      // Setting value should call setter
      double.value = 10
      expect(count.value).toBe(5)
      expect(double.value).toBe(10)
    })
  })

  describe('isComputed', () => {
    it('should return true for computed properties', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2)

      expect(isComputed(double)).toBe(true)
    })

    it('should return false for non-computed values', () => {
      const count = ref(0)

      expect(isComputed(count)).toBe(false)
      expect(isComputed(42)).toBe(false)
      expect(isComputed({})).toBe(false)
      expect(isComputed(null)).toBe(false)
    })
  })
})
