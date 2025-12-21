import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { isReadonly, readonly, ref, shallowReadonly } from '../../src/index.js'

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
})
