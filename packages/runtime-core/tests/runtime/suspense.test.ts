import { ShallowRef } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { SUSPENSE_COUNTER, useSuspense } from '../../src/index.js'
import * as contextModule from '../../src/runtime/context.js'

describe('runtime/suspense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSuspense', () => {
    it('应该从 inject 返回 suspense 计数器', () => {
      const mockCounter = new ShallowRef(0)
      const mockParentInstance = {
        provide: new Map([[SUSPENSE_COUNTER, mockCounter]]),
        parent: null,
        app: null
      }
      const mockInstance = {
        provide: new Map(),
        parent: mockParentInstance,
        app: null
      }

      vi.spyOn(contextModule, 'getInstance').mockReturnValue(mockInstance as any)

      const result = useSuspense()

      expect(result).toBe(mockCounter)
    })

    it('当没有 suspense 计数器时应该返回 undefined', () => {
      const mockInstance = {
        provide: new Map(),
        parent: null,
        app: null
      }

      vi.spyOn(contextModule, 'getInstance').mockReturnValue(mockInstance as any)

      const result = useSuspense()

      expect(result).toBeUndefined()
    })
  })
})
