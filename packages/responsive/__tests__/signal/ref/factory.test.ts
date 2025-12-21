import { describe, expect, it } from 'vitest'
import { propertyRef, PropertyRef, reactive, ref, Ref, shallowRef } from '../../../src/index.js'

describe('signal/ref/factory', () => {
  describe('ref', () => {
    it('should create a Ref instance without initial value', () => {
      const refInstance = ref()

      expect(refInstance).toBeInstanceOf(Ref)
      expect(refInstance.value).toBeUndefined()
    })

    it('should create a Ref instance with initial value', () => {
      const refInstance = ref(42)

      expect(refInstance).toBeInstanceOf(Ref)
      expect(refInstance.value).toBe(42)
    })

    it('should create a Ref instance with deep reactivity by default', () => {
      const refInstance = ref(42)

      expect(refInstance.deep).toBe(true)
    })

    it('should create a Ref instance with shallow reactivity', () => {
      const refInstance = ref(42, false)

      expect(refInstance).toBeInstanceOf(Ref)
      expect(refInstance.deep).toBe(false)
    })

    it('should support deep reactivity for nested objects', () => {
      const obj = { nested: { value: 0 } }
      const refInstance = ref(obj)

      expect(refInstance.value.nested.value).toBe(0)

      // Change nested property
      refInstance.value.nested.value = 42
      expect(refInstance.value.nested.value).toBe(42)
    })
  })

  describe('shallowRef', () => {
    it('should create a shallow Ref instance without initial value', () => {
      const refInstance = shallowRef()

      expect(refInstance).toBeInstanceOf(Ref)
      expect(refInstance.value).toBeUndefined()
      expect(refInstance.deep).toBe(false)
    })

    it('should create a shallow Ref instance with initial value', () => {
      const refInstance = shallowRef(42)

      expect(refInstance).toBeInstanceOf(Ref)
      expect(refInstance.value).toBe(42)
      expect(refInstance.deep).toBe(false)
    })

    it('should not trigger deep reactivity for nested objects', () => {
      const obj = { nested: { value: 0 } }
      const refInstance = shallowRef(obj)

      expect(refInstance.value.nested.value).toBe(0)

      // Change nested property - this should not trigger reactivity
      refInstance.value.nested.value = 42
      expect(refInstance.value.nested.value).toBe(42)
    })
  })

  describe('propertyRef', () => {
    it('should create a PropertyRef instance', () => {
      const target = { prop: 42 }
      const propertyRefInstance = propertyRef(target, 'prop')

      expect(propertyRefInstance).toBeInstanceOf(PropertyRef)
      expect(propertyRefInstance.value).toBe(42)
    })

    it('should create a PropertyRef instance with default value', () => {
      const target = {} as { prop?: number }
      const propertyRefInstance = propertyRef(target, 'prop', 100)

      expect(propertyRefInstance).toBeInstanceOf(PropertyRef)
      expect(propertyRefInstance.value).toBe(100)
    })

    it('should work with reactive objects', () => {
      const target = reactive({ name: 'John' })
      const propertyRefInstance = propertyRef(target, 'name')

      expect(propertyRefInstance.value).toBe('John')

      propertyRefInstance.value = 'Jane'
      expect(target.name).toBe('Jane')
    })
  })
})
