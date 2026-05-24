import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, isComputed, ref } from '../../src/index.js'

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
      const double = computed({
        get: () => count.value * 2,
        set: newValue => {
          count.value = newValue / 2
        }
      })

      expect(double.value).toBe(0)

      // Setting value should call setter
      double.value = 10
      expect(count.value).toBe(5)
      expect(double.value).toBe(10)
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
        '[computed] properties should not be modified directly unless a setter function is defined'
      )

      // Restore logger
      warnSpy.mockRestore()
    })

    describe('notify', () => {
      it('should mark computed as dirty and return this', () => {
        const count = ref(0)
        const double = computed(() => count.value * 2)

        // 首次访问使dirty变为false（缓存计算结果）
        expect(double.value).toBe(0)
        expect(double.dirty).toBe(false)

        // 调用notify应标记为dirty并返回实例自身
        const result = double.notify()
        expect(result).toBe(double)
        expect(double.dirty).toBe(true)
      })

      it('should not trigger signal again when already dirty', () => {
        const count = ref(0)
        const getter = vi.fn(() => count.value * 2)
        const double = computed(getter)

        // 访问value触发首次计算
        expect(double.value).toBe(0)
        expect(getter).toHaveBeenCalledTimes(1)

        // 修改依赖使computed变为dirty
        count.value = 1
        expect(double.dirty).toBe(true)

        // 再次调用notify，dirty已经是true，不应重复触发
        const result = double.notify()
        expect(result).toBe(double)
        expect(double.dirty).toBe(true)

        // 访问value应只重新计算一次
        expect(double.value).toBe(2)
        expect(getter).toHaveBeenCalledTimes(2)
      })

      it('should cause value to recompute on next access', () => {
        const count = ref(0)
        const double = computed(() => count.value * 2)

        expect(double.value).toBe(0)

        // 修改依赖值
        count.value = 5
        // notify已在内部被调用，dirty为true
        expect(double.dirty).toBe(true)

        // 访问value应触发重新计算
        expect(double.value).toBe(10)
        expect(double.dirty).toBe(false)
      })

      it('should support chaining calls', () => {
        const count = ref(0)
        const double = computed(() => count.value * 2)

        // 首次访问使dirty变为false
        double.value

        // 链式调用notify
        const result = double.notify().notify().notify()
        expect(result).toBe(double)
        expect(double.dirty).toBe(true)
      })
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
