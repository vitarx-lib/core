import { describe, expect, it, vi } from 'vitest'
import { Depend, isDeepSignal, isRef, isSignal, ref, watch } from '../../src'

describe('ref', () => {
  describe('基础功能', () => {
    it('应该正确创建ref对象', () => {
      const count = ref(0)
      expect(count.value).toBe(0)
      expect(isRef(count)).toBe(true)
      expect(isSignal(count)).toBe(true)
    })

    it('应该能够修改ref的值', () => {
      const count = ref(0)
      count.value = 1
      expect(count.value).toBe(1)
    })

    it('应该支持复杂数据类型', () => {
      const obj = ref({ count: 0 })
      expect(obj.value.count).toBe(0)
      obj.value.count = 1
      expect(obj.value.count).toBe(1)
    })

    it('应该支持嵌套ref', () => {
      const nested = ref(ref(0))
      expect(nested.value).toBe(0)
      nested.value = 1
      expect(nested.value).toBe(1)
    })
  })

  describe('响应式特性', () => {
    it('应该能够追踪依赖', () => {
      const count = ref(0)
      const dep = Depend.collect(() => {
        count.value
      })
      expect(dep.deps.has(count)).toBe(true)
    })
  })

  describe('深度响应式', () => {
    it('默认应该是深度响应式的', () => {
      const obj = ref({ nested: { count: 0 } })
      const fn = vi.fn()
      watch(obj, fn, { batch: false })
      obj.value.nested.count++
      expect(fn).toHaveBeenCalledOnce()
    })

    it('应该支持关闭深度响应式', () => {
      const obj = ref({ nested: { count: 0 } }, { deep: false })
      const fn = vi.fn()
      watch(obj, fn, { batch: false })
      obj.value.nested.count = 1
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe('类型检查', () => {
    it('isRef应该正确识别ref对象', () => {
      const count = ref(0)
      const plainObj = { value: 0 }

      expect(isRef(count)).toBe(true)
      expect(isRef(plainObj)).toBe(false)
    })
    it('ts类型声明校验', () => {
      const count = ref()
      expect(count.value).toBeUndefined()
      const count2 = ref(0)
      expect(count2.value).toBe(0)
      const count3 = ref<number>()
      expect(count3.value).toBeUndefined()
      const count4 = ref(0, { deep: false })
      expect(count4.value).toBe(0)
      expect(isDeepSignal(count4)).toBe(false)
    })
  })
})
