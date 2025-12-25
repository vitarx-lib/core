import { describe, expect, it } from 'vitest'
import { reactive, ref } from '../../../src/index.js'

describe('signal/reactive/helpers', () => {
  describe('reactive', () => {
    it('should create a reactive object', () => {
      const obj = { count: 0 }
      const reactiveObj = reactive(obj)

      expect(reactiveObj).toBeDefined()
      expect(reactiveObj.count).toBe(0)
    })

    it('should create a shallow reactive object', () => {
      const obj = { nested: { count: 0 } }
      const reactiveObj = reactive(obj, false)

      expect(reactiveObj).toBeDefined()
      expect(reactiveObj.nested).toBeDefined()
      expect(reactiveObj.nested.count).toBe(0)
    })

    it('should throw error for non-object targets', () => {
      expect(() => {
        reactive(42 as any)
      }).toThrow('Cannot reactive a non-object')
    })

    it('should throw error for signal ref', () => {
      const signal = ref(42)

      expect(() => {
        reactive(signal as any)
      }).toThrow('Cannot reactive a ref')
    })

    it('should work with arrays', () => {
      const arr = [1, 2, 3]
      const reactiveArr = reactive(arr)

      expect(Array.isArray(reactiveArr)).toBe(true)
      expect(reactiveArr[0]).toBe(1)
    })
  })
})
