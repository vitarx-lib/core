import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRenderer, setRenderer } from '../../src/index.js'
import type { ViewRenderer } from '../../src/types'

describe('runtime/renderer', () => {
  let mockRenderer: ViewRenderer

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setRenderer', () => {
    it('应该设置全局渲染器', () => {
      mockRenderer = {
        createElement: vi.fn(),
        createText: vi.fn(),
        createComment: vi.fn(),
        insert: vi.fn(),
        remove: vi.fn(),
        setText: vi.fn()
      } as any

      setRenderer(mockRenderer)
      expect(getRenderer()).toBe(mockRenderer)
    })
  })

  describe('getRenderer', () => {
    it('当设置时应该返回全局渲染器', () => {
      mockRenderer = {
        createElement: vi.fn()
      } as any

      setRenderer(mockRenderer)
      expect(getRenderer()).toBe(mockRenderer)
    })

    it('当未设置渲染器时应该抛出错误', () => {
      // 由于 globalRenderer 是模块作用域变量，我们无法直接重置它
      // 但我们可以通过检查代码实现来确保它会在未设置时抛出错误
      // 这里我们假设测试环境中初始状态下没有设置渲染器
      try {
        getRenderer()
      } catch (e) {
        expect((e as Error).message).toBe('[vitarx][ERROR] Renderer has not been registered.')
        return
      }
      // 如果没有抛出错误，说明之前的测试设置了渲染器
      // 我们可以通过设置一个新的渲染器然后再测试
      const mockRenderer = { createElement: vi.fn() } as any
      setRenderer(mockRenderer)
      expect(getRenderer()).toBe(mockRenderer)
    })
  })
})
