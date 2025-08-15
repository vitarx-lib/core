import { describe, expect, it, vi } from 'vitest'
import { isReactive, isSignal, reactive, ref, shallowReactive, watch } from '../../src'

describe('reactive', () => {
  describe('基础功能', () => {
    it('应该正确创建reactive对象', () => {
      const obj = reactive({ count: 0 })
      expect(obj.count).toBe(0)
      expect(isReactive(obj)).toBe(true)
      expect(isSignal(obj)).toBe(true)
    })

    it('应该能够修改reactive对象的属性', () => {
      const obj = reactive({ count: 0 })
      obj.count = 1
      expect(obj.count).toBe(1)
    })

    it('应该支持添加新属性', () => {
      const obj = reactive({ count: 0 }) as any
      obj.newProp = 'test'
      expect(obj.newProp).toBe('test')
    })

    it('应该支持删除属性', () => {
      const obj = reactive({ count: 0, removable: true })
      // @ts-ignore
      delete obj.removable
      expect('removable' in obj).toBe(false)
    })
  })

  describe('嵌套对象', () => {
    it('应该支持嵌套对象的响应式', () => {
      const obj = reactive({ nested: { count: 0 } })
      expect(obj.nested.count).toBe(0)
      const fn = vi.fn()
      watch(obj.nested, fn, { batch: false })
      obj.nested.count = 1
      expect(fn).toHaveBeenCalledOnce()
    })

    it('应该使嵌套对象也成为响应式', () => {
      const obj = reactive({ nested: { count: 0 } })
      expect(isReactive(obj.nested)).toBe(true)
    })
  })

  describe('集合类型', () => {
    it('应该支持Map类型', () => {
      const map = reactive(new Map<string, number>())
      map.set('count', 0)
      expect(map.get('count')).toBe(0)
      map.set('count', 1)
      expect(map.get('count')).toBe(1)
    })

    it('应该支持Set类型', () => {
      const set = reactive(new Set<number>())
      set.add(1)
      expect(set.has(1)).toBe(true)
      set.delete(1)
      expect(set.has(1)).toBe(false)
    })
  })

  describe('与ref的交互', () => {
    it('应该自动解包嵌套在reactive中的ref', () => {
      const count = ref(0)
      const obj = reactive({ count })

      // 访问时应该自动解包
      expect(obj.count).toBe(0)

      // 修改reactive中的属性应该影响原始ref
      obj.count = 1
      expect(count.value).toBe(1)

      // 修改原始ref应该影响reactive中的属性
      count.value = 2
      expect(obj.count).toBe(2)

      // shallowReactive应该保持原始ref
      const shallowObj = shallowReactive({ count })
      expect(shallowObj.count).toBe(count)
    })
  })

  describe('类型检查', () => {
    it('isReactive应该正确识别reactive对象', () => {
      const obj = reactive({ count: 0 })
      const plainObj = { count: 0 }

      expect(isReactive(obj)).toBe(true)
      expect(isReactive(plainObj)).toBe(false)
    })
  })
})
