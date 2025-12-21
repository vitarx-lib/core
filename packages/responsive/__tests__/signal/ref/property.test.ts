import { describe, expect, it } from 'vitest'
import { IS_REF, PropertyRef, reactive } from '../../../src/index.js'

describe('signal/ref/property', () => {
  describe('PropertyRef', () => {
    it('should create a PropertyRef instance', () => {
      const target = { prop: 42 }
      const propertyRef = new PropertyRef(target, 'prop')

      expect(propertyRef).toBeInstanceOf(PropertyRef)
      expect(propertyRef[IS_REF]).toBe(true)
    })

    it('should get property value', () => {
      const target = { prop: 42 }
      const propertyRef = new PropertyRef(target, 'prop')

      expect(propertyRef.value).toBe(42)
    })

    it('should set property value', () => {
      const target = { prop: 0 } as any
      const propertyRef = new PropertyRef(target, 'prop')

      propertyRef.value = 42

      expect(target.prop).toBe(42)
      expect(propertyRef.value).toBe(42)
    })

    it('should return default value when property is undefined', () => {
      const target = {} as { prop?: number }
      const propertyRef = new PropertyRef(target, 'prop', 100)

      expect(propertyRef.value).toBe(100)
    })

    it('should work with reactive objects', () => {
      const target = reactive({ name: 'John' })
      const propertyRef = new PropertyRef(target, 'name')

      expect(propertyRef.value).toBe('John')

      propertyRef.value = 'Jane'
      expect(target.name).toBe('Jane')
    })
  })
})
