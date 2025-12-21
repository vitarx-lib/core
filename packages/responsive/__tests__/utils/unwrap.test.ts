import { describe, expect, it } from 'vitest'
import { computed, ref, unref, unwrap } from '../../src/index.js'

describe('utils/unwrap', () => {
  describe('unref', () => {
    it('should return the value of a ref wrapper', () => {
      const r = ref(42)
      expect(unref(r)).toBe(42)
    })

    it('should return the value of a computed wrapper', () => {
      const c = computed(() => 42)
      expect(unref(c)).toBe(42)
    })

    it('should return the original value if it is not a ref wrapper', () => {
      expect(unref(42)).toBe(42)
      expect(unref('hello')).toBe('hello')
      expect(unref(null)).toBe(null)
      expect(unref(undefined)).toBe(undefined)
    })
  })

  describe('unwrapper', () => {
    it('should return the value of a ref wrapper', () => {
      const r = ref(42)
      expect(unwrap(r)).toBe(42)
    })

    it('should return the value of a computed wrapper', () => {
      const c = computed(() => 42)
      expect(unwrap(c)).toBe(42)
    })

    it('should return the value of a callable signal', () => {
      const s = ref(42)
      expect(unwrap(s)).toBe(42)
    })

    it('should return the original value if it is not a wrapper', () => {
      expect(unwrap(42)).toBe(42)
      expect(unwrap('hello')).toBe('hello')
      expect(unwrap(null)).toBe(null)
      expect(unwrap(undefined)).toBe(undefined)
    })
  })
})
