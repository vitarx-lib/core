import { describe, expect, it, vi } from 'vitest'
import { isSignal, reactive, ref } from '../../src/index'
import { computed } from '../../src/signal/implement/computed'

describe('computed', () => {
  describe('基础功能', () => {
    it('应该正确创建computed对象', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      expect(double.value).toBe(0)
      expect(isSignal(double)).toBe(true)
    })

    it('应该根据依赖的变化更新计算值', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2, { batch: false })

      count.value = 2
      expect(double.value).toBe(4)

      count.value = 3
      expect(double.value).toBe(6)
    })
  })

  describe('缓存机制', () => {
    it('应该缓存计算结果', () => {
      const count = ref(0)
      const fn = vi.fn(() => count.value * 2)
      const double = computed(fn, { batch: false })

      // 首次访问会计算
      expect(double.value).toBe(0)
      expect(fn).toHaveBeenCalledTimes(1)

      // 再次访问应该使用缓存
      expect(double.value).toBe(0)
      expect(fn).toHaveBeenCalledTimes(1)

      // 依赖变化后，再次访问会重新计算
      count.value = 2
      expect(double.value).toBe(4)
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('setter功能', () => {
    it('应该支持自定义setter', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2, {
        setter: val => {
          count.value = val / 2
        },
        batch: false
      })

      expect(double.value).toBe(0)

      double.value = 10
      expect(count.value).toBe(5)
      expect(double.value).toBe(10)
    })
  })

  describe('与reactive的交互', () => {
    it('应该支持reactive对象作为依赖', () => {
      const state = reactive({ count: 0 })
      const double = computed(() => state.count * 2, { batch: false })

      expect(double.value).toBe(0)

      state.count = 2
      expect(double.value).toBe(4)
    })
  })

  describe('嵌套computed', () => {
    it('应该支持嵌套的computed', () => {
      const count = ref(0)
      const double = computed(() => count.value * 2, { batch: false })
      const quadruple = computed(() => double.value * 2, { batch: false })

      expect(quadruple.value).toBe(0)

      count.value = 2
      expect(double.value).toBe(4)
      expect(quadruple.value).toBe(8)
    })
  })

  describe('immediate选项', () => {
    it('应该支持immediate选项立即计算', () => {
      const fn = vi.fn(() => 42)
      computed(fn, { immediate: true })

      // 不访问value属性也应该已经计算过一次
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})
