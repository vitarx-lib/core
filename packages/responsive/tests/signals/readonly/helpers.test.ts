import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { readonly, ref, shallowReadonly } from '../../../src/index.js'

describe('signal/readonly/helpers', () => {
  describe('readonly', () => {
    it('should create a readonly proxy', () => {
      const target = { prop: 42 }
      const readonlyProxy = readonly(target)

      expect(readonlyProxy).toBeDefined()
      expect(readonlyProxy.prop).toBe(42)
    })

    it('should create deep readonly proxies by default', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = readonly(target)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should create shallow readonly proxies when deep is false', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = readonly(target, false)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const readonlyProxy = readonly(target)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should unwrap callable ref values', () => {
      const callableSignal = ref(42)
      const target = { prop: callableSignal }
      const readonlyProxy = readonly(target)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should warn when setting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = readonly(target)

      // @ts-ignore - intentionally setting readonly property
      ;(readonlyProxy as any).prop = 100

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be set!'
      )
      warnSpy.mockRestore()
    })
  })

  describe('shallowReadonly', () => {
    it('should create a shallow readonly proxy', () => {
      const target = { prop: 42 }
      const readonlyProxy = shallowReadonly(target)

      expect(readonlyProxy).toBeDefined()
      expect(readonlyProxy.prop).toBe(42)
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const readonlyProxy = shallowReadonly(target)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should unwrap callable ref values', () => {
      const callableSignal = ref(42)
      const target = { prop: callableSignal }
      const readonlyProxy = shallowReadonly(target)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should warn when setting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = shallowReadonly(target)

      // @ts-ignore - intentionally setting readonly property
      ;(readonlyProxy as any).prop = 100

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be set!'
      )
      warnSpy.mockRestore()
    })
  })
})
