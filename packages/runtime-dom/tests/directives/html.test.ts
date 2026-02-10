import { nextTick, ref } from '@vitarx/responsive'
import { ElementView } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import html from '../../src/directives/html.js'

describe('Runtime DOM Directives - html', () => {
  let element: HTMLElement
  const view = { children: [] } as unknown as ElementView
  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.innerHTML = ''
    document.body.removeChild(element)
  })

  describe('created', () => {
    it('应该设置元素的 innerHTML', () => {
      const binding = {
        value: '<span>Hello World</span>'
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<span>Hello World</span>')
    })

    it('应该在值为空字符串时不设置 innerHTML', () => {
      element.innerHTML = '<p>initial</p>'
      const binding = {
        value: ''
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<p>initial</p>')
    })

    it('应该在值为 null 时不设置 innerHTML', () => {
      element.innerHTML = '<p>initial</p>'
      const binding = {
        value: null
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<p>initial</p>')
    })

    it('应该在值为 undefined 时不设置 innerHTML', () => {
      element.innerHTML = '<p>initial</p>'
      const binding = {
        value: undefined
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<p>initial</p>')
    })

    it('应该在值为非字符串时不设置 innerHTML', () => {
      element.innerHTML = '<p>initial</p>'
      const binding = {
        value: 123
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<p>initial</p>')
    })

    it('应该在元素有子元素时发出警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const binding = {
        value: '<span>Hello</span>'
      }
      html.created?.(element, binding, { children: [{}] } as any)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx Warn][v-html] directive should not be used on an element with children',
        element,
        undefined
      )
      warnSpy.mockRestore()
    })

    it('应该响应式更新 innerHTML', async () => {
      const htmlValue = ref('<span>Initial</span>')
      const binding = {
        get value() {
          return htmlValue.value
        }
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<span>Initial</span>')
      htmlValue.value = '<strong>Updated</strong>'
      await nextTick()
      expect(element.innerHTML).toBe('<strong>Updated</strong>')
    })

    it('应该正确解析 HTML 标签', () => {
      const binding = {
        value: '<div class="test"><p>Content</p></div>'
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<div class="test"><p>Content</p></div>')
    })

    it('应该正确处理 HTML 实体', () => {
      const binding = {
        value: '&lt;div&gt;Hello&lt;/div&gt;'
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('&lt;div&gt;Hello&lt;/div&gt;')
    })
  })

  describe('dispose', () => {
    it('应该停止响应式效果', async () => {
      const htmlValue = ref('<span>Initial</span>')
      const binding = {
        get value() {
          return htmlValue.value
        }
      }
      html.created?.(element, binding, view)
      expect(element.innerHTML).toBe('<span>Initial</span>')
      html.dispose?.(element, binding, {} as any)
      htmlValue.value = '<strong>Updated</strong>'
      await nextTick()
      expect(element.innerHTML).toBe('<span>Initial</span>')
    })

    it('应该在 effect 不存在时不报错', () => {
      expect(() => html.dispose?.(element, {} as any, {} as any)).not.toThrow()
    })
  })

  describe('getSSRProps', () => {
    it('应该在值为有效字符串时返回 v-html 属性', () => {
      const binding = {
        value: '<span>Hello World</span>'
      }
      const result = html.getSSRProps?.(binding, view)
      expect(result).toEqual({ 'v-html': '<span>Hello World</span>' })
    })

    it('应该在值为空字符串时返回 undefined', () => {
      const binding = {
        value: ''
      }
      const result = html.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为 null 时返回 undefined', () => {
      const binding = {
        value: null
      }
      const result = html.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为 undefined 时返回 undefined', () => {
      const binding = {
        value: undefined
      }
      const result = html.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为非字符串时返回 undefined', () => {
      const binding = {
        value: 123
      }
      const result = html.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })
  })
})
