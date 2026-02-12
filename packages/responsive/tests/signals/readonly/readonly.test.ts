import { logger } from '@vitarx/utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from '../../../src/index.js'
import { createReadonlyProxy } from '../../../src/signals/readonly/readonly.js'

describe('signal/readonly/readonly', () => {
  describe('createReadonlyProxy', () => {
    it('should create a readonly proxy', () => {
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy).toBeDefined()
      expect(readonlyProxy.prop).toBe(42)
    })

    it('should unwrap ref values', () => {
      const refValue = ref(42)
      const target = { prop: refValue }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.prop).toBe(42)
    })

    it('should create deep readonly proxies', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should create shallow readonly proxies', () => {
      const target = { nested: { prop: 42 } }
      const readonlyProxy = createReadonlyProxy(target, false)

      expect(readonlyProxy.nested).toBeDefined()
      expect(readonlyProxy.nested.prop).toBe(42)
    })

    it('should warn when setting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      // @ts-ignore - intentionally setting readonly property
      ;(readonlyProxy as any).prop = 100

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be set!'
      )
      warnSpy.mockRestore()
    })

    it('should warn when deleting properties', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
      const target = { prop: 42 }
      const readonlyProxy = createReadonlyProxy(target, true)

      // @ts-ignore - intentionally deleting readonly property
      delete (readonlyProxy as any).prop

      expect(warnSpy).toHaveBeenCalledWith(
        '[Readonly] The object is read-only, and the prop attribute cannot be removed!'
      )
      warnSpy.mockRestore()
    })

    it('should bind functions to target', () => {
      const target = {
        prop: 42,
        method() {
          return this.prop
        }
      }
      const readonlyProxy = createReadonlyProxy(target, true)

      expect(readonlyProxy.method()).toBe(42)
    })

    it('should return cached proxy when called with same target', () => {
      const target = { prop: 42 }
      const readonlyProxy1 = createReadonlyProxy(target, true)
      const readonlyProxy2 = createReadonlyProxy(target, true)

      expect(readonlyProxy1).toBe(readonlyProxy2)
    })
  })
})
