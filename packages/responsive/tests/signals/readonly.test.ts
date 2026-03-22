import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { isReadonly, reactive, readonly, ref, shallowReactive, shallowReadonly, watch } from '../../src/index.js'

describe('signal/readonly', () => {
  describe('readonly', () => {
    it('should create a readonly object', () => {
      const obj = { count: 0 }
      const readonlyObj = readonly(obj)

      expect(isReadonly(readonlyObj)).toBe(true)
      expect(readonlyObj.count).toBe(0)
    })

    it('should prevent property modification', () => {
      const obj = { count: 0 }
      const readonlyObj = readonly(obj)

      // Mock logger.warn to verify it's called
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      // Attempt to modify property - should trigger warning
      ;(readonlyObj as any).count = 42
      expect(readonlyObj.count).toBe(0)

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the count attribute cannot be set!'
      )

      // Restore logger
      warnSpy.mockRestore()
    })

    it('should prevent property deletion', () => {
      const obj = { count: 0 }
      const readonlyObj = readonly(obj)

      // Mock logger.warn to verify it's called
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      // Attempt to delete property - should trigger warning
      delete (readonlyObj as any).count
      expect(readonlyObj.count).toBe(0)

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the count attribute cannot be removed!'
      )

      // Restore logger
      warnSpy.mockRestore()
    })

    it('should support deep readonly by default', () => {
      const obj = { nested: { value: 0 } }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.nested.value).toBe(0)

      // Attempt to modify nested property - should trigger warning
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      ;(readonlyObj.nested as any).value = 42
      expect(readonlyObj.nested.value).toBe(0)

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalled()

      // Restore logger
      warnSpy.mockRestore()
    })

    it('should work with refs as properties', () => {
      const refValue = ref(42)
      const obj = { count: refValue }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.count).toBe(42)

      // Update ref value - readonly object should reflect the change
      refValue.value = 100
      expect(readonlyObj.count).toBe(100)
    })
  })

  describe('shallowReadonly', () => {
    it('should create a shallow readonly object', () => {
      const obj = { count: 0 }
      const shallowReadonlyObj = shallowReadonly(obj)

      expect(isReadonly(shallowReadonlyObj)).toBe(true)
      expect(shallowReadonlyObj.count).toBe(0)
    })

    it('should prevent direct property modification but allow nested object modification', () => {
      const obj = { nested: { value: 0 } }
      const shallowReadonlyObj = shallowReadonly(obj)

      // Mock logger.warn to verify it's called for direct property
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})

      // Attempt to modify direct property - should trigger warning
      ;(shallowReadonlyObj as any).nested = { value: 42 }
      expect(shallowReadonlyObj.nested.value).toBe(0)

      // Verify warning was called
      expect(warnSpy).toHaveBeenCalled()

      // Restore logger
      warnSpy.mockRestore()

      // Modify nested object - should be allowed
      shallowReadonlyObj.nested.value = 42
      expect(shallowReadonlyObj.nested.value).toBe(42)
    })
  })

  describe('搭配响应式不破坏可追踪性', () => {
    it('should work with reactive objects', () => {
      const reactiveObj = reactive({ count: 0 })
      const readonlyObj = readonly(reactiveObj)
      const cb = vi.fn()
      watch(() => readonlyObj.count, cb, { flush: 'sync' })
      reactiveObj.count++
      expect(cb).toHaveBeenCalled()
    })
  })

  describe('edge cases: nested collections', () => {
    it('should handle Set methods with correct this binding in readonly', () => {
      const obj = { set: new Set([1, 2, 3]) }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.set.size).toBe(3)
      expect(readonlyObj.set.has(1)).toBe(true)
      expect(readonlyObj.set.has(4)).toBe(false)

      const values = [...readonlyObj.set.values()]
      expect(values).toEqual([1, 2, 3])

      const keys = [...readonlyObj.set.keys()]
      expect(keys).toEqual([1, 2, 3])

      const entries = [...readonlyObj.set.entries()]
      expect(entries).toEqual([[1, 1], [2, 2], [3, 3]])

      readonlyObj.set.forEach((value) => {
        expect([1, 2, 3]).toContain(value)
      })
    })

    it('should handle Map methods with correct this binding in readonly', () => {
      const obj = { map: new Map([['a', 1], ['b', 2]]) }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.map.size).toBe(2)
      expect(readonlyObj.map.has('a')).toBe(true)
      expect(readonlyObj.map.get('a')).toBe(1)
      expect(readonlyObj.map.get('c')).toBeUndefined()

      const keys = [...readonlyObj.map.keys()]
      expect(keys).toEqual(['a', 'b'])

      const values = [...readonlyObj.map.values()]
      expect(values).toEqual([1, 2])

      const entries = [...readonlyObj.map.entries()]
      expect(entries).toEqual([['a', 1], ['b', 2]])
    })

    it('should handle WeakSet methods with correct this binding in readonly', () => {
      const item1 = { id: 1 }
      const item2 = { id: 2 }
      const obj = { weakSet: new WeakSet([item1, item2]) }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.weakSet.has(item1)).toBe(true)
      expect(readonlyObj.weakSet.has(item2)).toBe(true)
      expect(readonlyObj.weakSet.has({ id: 3 })).toBe(false)
    })

    it('should handle WeakMap methods with correct this binding in readonly', () => {
      const key1 = { id: 1 }
      const key2 = { id: 2 }
      const obj = { weakMap: new WeakMap([[key1, 'value1'], [key2, 'value2']]) }
      const readonlyObj = readonly(obj)

      expect(readonlyObj.weakMap.has(key1)).toBe(true)
      expect(readonlyObj.weakMap.get(key1)).toBe('value1')
      expect(readonlyObj.weakMap.get(key2)).toBe('value2')
      expect(readonlyObj.weakMap.get({ id: 3 })).toBeUndefined()
    })

    it('should handle readonly(shallowReactive(obj)) with Set', () => {
      const obj = { set: new Set([1, 2, 3]) }
      const shallowReactiveObj = shallowReactive(obj)
      const readonlyObj = readonly(shallowReactiveObj)

      expect(readonlyObj.set.size).toBe(3)
      expect(readonlyObj.set.has(1)).toBe(true)
      expect(readonlyObj.set.has(4)).toBe(false)

      const values = [...readonlyObj.set.values()]
      expect(values).toEqual([1, 2, 3])
    })

    it('should handle readonly(shallowReactive(obj)) with Map', () => {
      const obj = { map: new Map([['a', 1], ['b', 2]]) }
      const shallowReactiveObj = shallowReactive(obj)
      const readonlyObj = readonly(shallowReactiveObj)

      expect(readonlyObj.map.size).toBe(2)
      expect(readonlyObj.map.has('a')).toBe(true)
      expect(readonlyObj.map.get('a')).toBe(1)

      const keys = [...readonlyObj.map.keys()]
      expect(keys).toEqual(['a', 'b'])
    })

    it('should handle shallowReadonly with nested Set', () => {
      const obj = { set: new Set([1, 2, 3]), nested: { value: 1 } }
      const shallowReadonlyObj = shallowReadonly(obj)

      expect(shallowReadonlyObj.set.size).toBe(3)
      expect(shallowReadonlyObj.set.has(1)).toBe(true)

      expect(shallowReadonlyObj.nested.value).toBe(1)
      shallowReadonlyObj.nested.value = 42
      expect(shallowReadonlyObj.nested.value).toBe(42)
    })

    it('should handle shallowReadonly with nested Map', () => {
      const obj = { map: new Map([['a', 1]]), nested: { value: 1 } }
      const shallowReadonlyObj = shallowReadonly(obj)

      expect(shallowReadonlyObj.map.size).toBe(1)
      expect(shallowReadonlyObj.map.get('a')).toBe(1)

      expect(shallowReadonlyObj.nested.value).toBe(1)
      shallowReadonlyObj.nested.value = 42
      expect(shallowReadonlyObj.nested.value).toBe(42)
    })

    it('should handle readonly(reactive(obj)) with nested collections', () => {
      const obj = { set: new Set([1, 2, 3]), map: new Map([['a', 1]]) }
      const reactiveObj = reactive(obj)
      const readonlyObj = readonly(reactiveObj)

      expect(readonlyObj.set.size).toBe(3)
      expect(readonlyObj.set.has(1)).toBe(true)

      expect(readonlyObj.map.size).toBe(1)
      expect(readonlyObj.map.get('a')).toBe(1)
    })
  })
})
