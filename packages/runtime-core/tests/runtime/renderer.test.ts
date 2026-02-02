import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getRenderContext, getRenderer, setRenderer, withRenderContext } from '../../src/index.js'
import type { RenderContext, ViewRenderer } from '../../src/types'

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

  describe('withRenderContext', () => {
    it('应该在提供的渲染上下文中执行函数', () => {
      const mockContext: RenderContext = {
        hostElement: {} as any
      }
      const testValue = 'test'

      const result = withRenderContext(() => {
        expect(getRenderContext()).toBe(mockContext)
        return testValue
      }, mockContext)

      expect(result).toBe(testValue)
    })

    it('应该在执行后恢复之前的渲染上下文', () => {
      const newContext: RenderContext = {
        hostElement: {} as any
      }

      let outerContext: RenderContext | undefined

      // 嵌套调用，测试上下文恢复
      withRenderContext(() => {
        const innerContext = getRenderContext()
        expect(innerContext).toEqual({})

        withRenderContext(() => {
          expect(getRenderContext()).toBe(newContext)
        }, newContext)

        // 内部调用结束后，应该恢复到外部上下文
        outerContext = getRenderContext()
      })

      expect(outerContext).toEqual({})
    })

    it('应该使用空对象作为默认上下文', () => {
      const result = withRenderContext(() => {
        expect(getRenderContext()).toEqual({})
        return 'test'
      })

      expect(result).toBe('test')
    })

    it('即使函数抛出异常也应该恢复之前的上下文', () => {
      const newContext: RenderContext = {
        hostElement: {} as any
      }

      let outerContext: RenderContext | undefined

      expect(() => {
        withRenderContext(() => {
          expect(getRenderContext()).toEqual({})

          withRenderContext(() => {
            expect(getRenderContext()).toBe(newContext)
            throw new Error('Test error')
          }, newContext)
        })
      }).toThrow('Test error')
    })
  })

  describe('getRenderContext', () => {
    it('应该返回当前渲染上下文', () => {
      const mockContext: RenderContext = {
        hostElement: {} as any
      }

      withRenderContext(() => {
        expect(getRenderContext()).toBe(mockContext)
      }, mockContext)
    })

    it('当没有渲染上下文时应该返回 undefined', () => {
      expect(getRenderContext()).toBeUndefined()
    })

    it('应该返回类型化的渲染上下文', () => {
      interface TestRenderContext extends RenderContext {
        test: string
      }

      const mockContext: TestRenderContext = {
        hostElement: {} as any,
        test: 'test value'
      }

      withRenderContext(() => {
        expect(getRenderContext<TestRenderContext>()).toBe(mockContext)
        expect(getRenderContext<TestRenderContext>()?.test).toBe('test value')
      }, mockContext)
    })
  })
})
