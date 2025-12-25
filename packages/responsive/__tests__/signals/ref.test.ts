import { describe, expect, it, vi } from 'vitest'
import { propertyRef, reactive, ref, shallowRef, watch } from '../../src/index.js'

describe('signal/ref', () => {
  describe('ref', () => {
    it('should create a ref with initial value', () => {
      const r = ref(42)
      expect(r.value).toBe(42)
    })

    it('should create a ref without initial value', () => {
      const r = ref()
      expect(r.value).toBeUndefined()
    })

    it('should update ref value', () => {
      const r = ref(0)
      expect(r.value).toBe(0)

      r.value = 42
      expect(r.value).toBe(42)
    })

    it('should trigger updates when value changes', () => {
      const r = ref(0)
      const callback = vi.fn()

      // Watch the ref to establish dependency
      const watcher = watch(r, callback, { flush: 'sync' })

      // Update value to trigger the watcher
      r.value = 42

      // Callback should be called with new and old values
      expect(callback).toHaveBeenCalledWith(42, 0, expect.any(Function))

      watcher.dispose()
    })

    it('should support deep reactivity by default', () => {
      const obj = { nested: { value: 0 } }
      const r = ref(obj)

      expect(r.value.nested.value).toBe(0)

      // Change nested property
      r.value.nested.value = 42

      // This should work because of deep reactivity
      expect(r.value.nested.value).toBe(42)
    })
  })

  describe('shallowRef', () => {
    it('should create a shallow ref with initial value', () => {
      const r = shallowRef(42)
      expect(r.value).toBe(42)
    })

    it('should create a shallow ref without initial value', () => {
      const r = shallowRef()
      expect(r.value).toBeUndefined()
    })

    it('should not trigger deep reactivity for nested objects', () => {
      const obj = { nested: { value: 0 } }
      const r = shallowRef(obj)

      expect(r.value.nested.value).toBe(0)

      // Change nested property - this should not trigger reactivity
      r.value.nested.value = 42

      // Value should still be accessible
      expect(r.value.nested.value).toBe(42)
    })
  })

  describe('propertyRef', () => {
    it('should create a property ref that reflects target property changes', () => {
      const target = reactive({ name: 'John' })
      const nameRef = propertyRef(target, 'name')

      expect(nameRef.value).toBe('John')

      // Change target property
      target.name = 'Jane'
      expect(nameRef.value).toBe('Jane')
    })

    it('should update target property when ref value changes', () => {
      const target = reactive({ name: 'John' })
      const nameRef = propertyRef(target, 'name')

      expect(target.name).toBe('John')

      // Change ref value
      nameRef.value = 'Jane'
      expect(target.name).toBe('Jane')
    })

    it('should support default value', () => {
      const target = reactive({} as { name?: string })
      const nameRef = propertyRef(target, 'name', 'Default')

      expect(nameRef.value).toBe('Default')

      // Set value
      nameRef.value = 'John'
      expect(target.name).toBe('John')
    })
  })
})
