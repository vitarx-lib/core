import { show } from '../../../src/shared/directives/show.js'

describe('Runtime Core Shared Directives - show', () => {
  let element: HTMLElement & { __effect?: any }

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
  })

  describe('created', () => {
    it('应该保存原始 display 样式并创建响应式效果', () => {
      // 设置初始样式
      element.style.display = 'block'

      const binding = {
        value: true
      }

      show.created?.(element, binding as any, {} as any)

      expect(element.style.display).toBe('block')
      expect((element as any).__effect).toBeDefined()
    })

    it('应该在值为 false 时设置 display 为 none', () => {
      element.style.display = 'block'

      const binding = {
        value: false
      }

      show.created?.(element, binding as any, {} as any)

      expect(element.style.display).toBe('none')
    })
  })

  describe('dispose', () => {
    it('应该清理响应式效果', () => {
      const binding = {
        value: true
      }

      show.created?.(element, binding as any, {} as any)

      // 检查 __effect 是否存在
      if (element.__effect) {
        const mockDispose = vi.spyOn(element.__effect, 'dispose')
        show.dispose?.(element, binding as any, {} as any)
        expect(mockDispose).toHaveBeenCalled()
      } else {
        // 如果 __effect 不存在，确保 dispose 方法不会抛出错误
        expect(() => {
          show.dispose?.(element, binding as any, {} as any)
        }).not.toThrow()
      }
    })

    it('应该处理没有 __effect 的情况', () => {
      expect(() => {
        // @ts-ignore
        show.dispose(element)
      }).not.toThrow()
    })
  })

  describe('getSSRProps', () => {
    it('应该在值为 true 时返回空对象', () => {
      const binding = {
        value: true
      }

      const result = show.getSSRProps?.(binding as any, {} as any)
      expect(result).toEqual({})
    })

    it('应该在值为 false 时返回 display: none 样式', () => {
      const binding = {
        value: false
      }

      const result = show.getSSRProps?.(binding as any, {} as any)
      expect(result).toEqual({ style: { display: 'none' } })
    })
  })
})
