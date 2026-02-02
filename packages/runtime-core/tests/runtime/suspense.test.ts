import { ShallowRef } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { inject, SUSPENSE_COUNTER, useSuspense } from '../../src/index.js'

// Mock inject
vi.mock('../../src/runtime/provide', () => ({
  inject: vi.fn()
}))

describe('runtime/suspense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useSuspense', () => {
    it('应该从 inject 返回 suspense 计数器', () => {
      const mockCounter = new ShallowRef(0)
      ;(inject as any).mockReturnValue(mockCounter)

      const result = useSuspense()

      expect(inject).toHaveBeenCalledWith(SUSPENSE_COUNTER, undefined)
      expect(result).toBe(mockCounter)
    })

    it('当没有 suspense 计数器时应该返回 undefined', () => {
      ;(inject as any).mockReturnValue(undefined)

      const result = useSuspense()

      expect(inject).toHaveBeenCalledWith(SUSPENSE_COUNTER, undefined)
      expect(result).toBeUndefined()
    })
  })
})
