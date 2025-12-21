import { describe, expect, it } from 'vitest'
import { isMakeRaw, markRaw, reactive, toRaw } from '../../src/index.js'

describe('utils/raw', () => {
  describe('markRaw', () => {
    it('should mark an object as raw', () => {
      const obj = { value: 42 }
      const rawObj = markRaw(obj)

      expect(rawObj).toBe(obj)
      expect(isMakeRaw(rawObj)).toBe(true)
    })

    it('should throw TypeError for non-object values', () => {
      expect(() => {
        markRaw(null as any)
      }).toThrow(TypeError)

      expect(() => {
        markRaw(undefined as any)
      }).toThrow(TypeError)

      expect(() => {
        markRaw(42 as any)
      }).toThrow(TypeError)

      expect(() => {
        markRaw('hello' as any)
      }).toThrow(TypeError)
    })
  })

  describe('isMakeRaw', () => {
    it('should return true for marked raw objects', () => {
      const obj = { value: 42 }
      const rawObj = markRaw(obj)

      expect(isMakeRaw(rawObj)).toBe(true)
    })

    it('should return false for non-marked objects', () => {
      const obj = { value: 42 }

      expect(isMakeRaw(obj)).toBe(false)
      expect(isMakeRaw(null)).toBe(false)
      expect(isMakeRaw(undefined)).toBe(false)
      expect(isMakeRaw(42)).toBe(false)
    })
  })

  describe('toRaw', () => {
    it('should return the raw value of a reactive object', () => {
      const obj = { value: 42 }
      const reactiveObj = reactive(obj)

      const raw = toRaw(reactiveObj)
      expect(raw).toBe(obj)
    })

    it('should return the original value for non-reactive objects', () => {
      const obj = { value: 42 }

      const raw = toRaw(obj)
      expect(raw).toBe(obj)
    })
  })
})
