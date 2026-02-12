import { describe, expect, it, vi } from 'vitest'
import { IS_REF, PropertyRef, reactive, ref, toRef, toRefs, ValueRef } from '../../../src/index.js'

describe('signal/ref/utils', () => {
  describe('toRef', () => {
    it('should convert a function to a readonly ref', () => {
      const fn = vi.fn(() => 42)
      const refWrapper = toRef(fn)

      expect(refWrapper[IS_REF]).toBe(true)
      expect(refWrapper.value).toBe(42)
      expect(fn).toHaveBeenCalled()
    })

    it('should return existing ref as-is', () => {
      const existingRef = ref(42)
      const refWrapper = toRef(existingRef)

      expect(refWrapper).toBe(existingRef)
    })

    it('should wrap plain values in a Ref', () => {
      const refWrapper = toRef(42)

      expect(refWrapper).toBeInstanceOf(ValueRef)
      expect(refWrapper.value).toBe(42)
    })

    it('should create PropertyRef for object property', () => {
      const obj = { prop: 42 }
      const refWrapper = toRef(obj, 'prop')

      expect(refWrapper).toBeInstanceOf(PropertyRef)
      expect(refWrapper.value).toBe(42)
    })

    it('should create PropertyRef with default value', () => {
      const obj = {} as { prop?: number }
      const refWrapper = toRef(obj, 'prop', 100)

      expect(refWrapper).toBeInstanceOf(PropertyRef)
      expect(refWrapper.value).toBe(100)
    })

    it('should return existing ref when property is a ref', () => {
      const refValue = ref(42)
      const obj = { prop: refValue }
      const refWrapper = toRef(obj, 'prop')

      expect(refWrapper).toBe(refValue)
    })

    it('should cache PropertyRef for the same object and key', () => {
      const obj = { prop: 42 }
      const ref1 = toRef(obj, 'prop')
      const ref2 = toRef(obj, 'prop')

      expect(ref1).toBe(ref2)
      expect(ref1).toBeInstanceOf(PropertyRef)
    })

    it('should create different PropertyRef for different keys', () => {
      const obj = { prop1: 42, prop2: 'hello' }
      const ref1 = toRef(obj, 'prop1')
      const ref2 = toRef(obj, 'prop2')

      expect(ref1).not.toBe(ref2)
      expect(ref1.value).toBe(42)
      expect(ref2.value).toBe('hello')
    })

    it('should create different PropertyRef for different objects', () => {
      const obj1 = { prop: 42 }
      const obj2 = { prop: 'hello' }
      const ref1 = toRef(obj1, 'prop')
      const ref2 = toRef(obj2, 'prop')

      expect(ref1).not.toBe(ref2)
      expect(ref1.value).toBe(42)
      expect(ref2.value).toBe('hello')
    })
  })

  describe('toRefs', () => {
    it('should convert reactive object properties to refs', () => {
      const reactiveObj = reactive({ count: 42, name: 'test' })
      const refs = toRefs(reactiveObj)

      expect(refs.count).toBeInstanceOf(PropertyRef)
      expect(refs.name).toBeInstanceOf(PropertyRef)
      expect(refs.count.value).toBe(42)
      expect(refs.name.value).toBe('test')
    })

    it('should warn when called on non-reactive object', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const obj = { count: 42 }
      const refs = toRefs(obj)

      expect(refs.count).toBeInstanceOf(PropertyRef)
      expect(refs.count.value).toBe(42)
      expect(warnSpy).toHaveBeenCalledWith('toRefs() called on a non-reactive object')

      warnSpy.mockRestore()
    })

    it('should not warn when skipWarn is true', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const obj = { count: 42 }
      const refs = toRefs(obj, true)

      expect(refs.count).toBeInstanceOf(PropertyRef)
      expect(refs.count.value).toBe(42)
      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should throw error when called on non-object', () => {
      expect(() => {
        toRefs(42 as any)
      }).toThrow('toRefs() called on a non-object')
    })
  })
})
