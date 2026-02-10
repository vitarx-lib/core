import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, it } from 'vitest'
import show from '../../src/directives/show.js'

describe('Runtime Core Shared Directives - show', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    element.style.display = ''
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
    it('应该还原样式', async () => {
      const isShow = ref(true)
      const binding = {
        get value() {
          return isShow.value
        }
      }
      element.style.display = 'block'
      show.created?.(element, binding, {} as any)
      expect(element.style.display).toBe('block')
      isShow.value = false
      await nextTick()
      expect(element.style.display).toBe('none')
      show.dispose?.(element, binding, {} as any)
      expect(element.style.display).toBe('block')
    })
  })

  describe('getSSRProps', () => {
    it('应该在值为 true 时返回 undefined', () => {
      const binding = {
        value: true
      }

      const result = show.getSSRProps?.(binding as any, {} as any)
      expect(result).toBeUndefined()
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
