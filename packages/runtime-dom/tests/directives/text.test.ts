import { nextTick, ref } from '@vitarx/responsive'
import { ElementView } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import text from '../../src/directives/text.js'

describe('Runtime DOM Directives - text', () => {
  let element: HTMLElement
  const view = { children: [] } as unknown as ElementView
  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.textContent = ''
    document.body.removeChild(element)
  })

  describe('created', () => {
    it('应该设置元素的 textContent', () => {
      const binding = {
        value: 'Hello World'
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('Hello World')
    })

    it('应该在值为空字符串时不设置 textContent', () => {
      element.textContent = 'initial'
      const binding = {
        value: ''
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('initial')
    })

    it('应该在值为 null 时不设置 textContent', () => {
      element.textContent = 'initial'
      const binding = {
        value: null
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('initial')
    })

    it('应该在值为 undefined 时不设置 textContent', () => {
      element.textContent = 'initial'
      const binding = {
        value: undefined
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('initial')
    })

    it('应该在值为非字符串时不设置 textContent', () => {
      element.textContent = 'initial'
      const binding = {
        value: 123
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('initial')
    })

    it('应该在元素有子元素时发出警告', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const binding = {
        value: 'Hello'
      }
      text.created?.(element, binding, { children: [{}] } as any)
      expect(warnSpy).toHaveBeenCalledWith(
        '[Vitarx Warn][v-text] directive should not be used on an element with children',
        element,
        undefined
      )
      warnSpy.mockRestore()
    })

    it('应该响应式更新 textContent', async () => {
      const textValue = ref('Initial')
      const binding = {
        get value() {
          return textValue.value
        }
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('Initial')
      textValue.value = 'Updated'
      await nextTick()
      expect(element.textContent).toBe('Updated')
    })
  })

  describe('dispose', () => {
    it('应该停止响应式效果', async () => {
      const textValue = ref('Initial')
      const binding = {
        get value() {
          return textValue.value
        }
      }
      text.created?.(element, binding, view)
      expect(element.textContent).toBe('Initial')
      text.dispose?.(element, binding, view)
      textValue.value = 'Updated'
      await nextTick()
      expect(element.textContent).toBe('Initial')
    })

    it('应该在 effect 不存在时不报错', () => {
      expect(() => text.dispose?.(element, { value: '' }, {} as any)).not.toThrow()
    })
  })

  describe('getSSRProps', () => {
    it('应该在值为有效字符串时返回 v-text 属性', () => {
      const binding = {
        value: 'Hello World'
      }
      const result = text.getSSRProps?.(binding, view)
      expect(result).toEqual({ 'v-text': 'Hello World' })
    })

    it('应该在值为空字符串时返回 undefined', () => {
      const binding = {
        value: ''
      }
      const result = text.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为 null 时返回 undefined', () => {
      const binding = {
        value: null
      }
      const result = text.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为 undefined 时返回 undefined', () => {
      const binding = {
        value: undefined
      }
      const result = text.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })

    it('应该在值为非字符串时返回 undefined', () => {
      const binding = {
        value: 123
      }
      const result = text.getSSRProps?.(binding, view)
      expect(result).toBeUndefined()
    })
  })
})
