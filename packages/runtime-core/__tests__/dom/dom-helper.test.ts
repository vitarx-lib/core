import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement, DomHelper, Fragment, type StyleRules } from '../../src'

describe('DomHelper', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('mergeCssClass', () => {
    it('应该合并两个字符串类型的class', () => {
      const result = DomHelper.mergeCssClass('class1 class2', 'class3 class4')
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })

    it('应该合并字符串和数组类型的class', () => {
      const result = DomHelper.mergeCssClass('class1 class2', ['class3', 'class4'])
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })

    it('应该合并字符串和对象类型的class', () => {
      const result = DomHelper.mergeCssClass('class1 class2', {
        class3: true,
        class4: false,
        class5: true
      })
      expect(result).toEqual(['class1', 'class2', 'class3', 'class5'])
    })

    it('应该合并数组和对象类型的class', () => {
      const result = DomHelper.mergeCssClass(['class1', 'class2'], {
        class3: true,
        class4: false,
        class5: true
      })
      expect(result).toEqual(['class1', 'class2', 'class3', 'class5'])
    })

    it('应该合并两个数组并去重', () => {
      const result = DomHelper.mergeCssClass(['class1', 'class2', 'class1'], ['class2', 'class3'])
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该合并两个对象并去重', () => {
      const result = DomHelper.mergeCssClass(
        { class1: true, class2: true, class3: false },
        { class2: false, class3: true, class4: true }
      )
      expect(result).toEqual(['class1', 'class2', 'class3', 'class4'])
    })
  })

  describe('mergeCssStyle', () => {
    it('应该合并两个字符串类型的样式', () => {
      const result = DomHelper.mergeCssStyle(
        'color: red; font-size: 14px',
        'background: blue; color: green'
      )
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })

    it('应该合并字符串和对象类型的样式', () => {
      const result = DomHelper.mergeCssStyle('color: red; font-size: 14px', {
        background: 'blue',
        color: 'green'
      })
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })

    it('应该合并两个对象，后面的值覆盖前面的值', () => {
      const result = DomHelper.mergeCssStyle(
        { color: 'red', fontSize: '14px' },
        { background: 'blue', color: 'green' }
      )
      expect(result).toEqual({ color: 'green', fontSize: '14px', background: 'blue' })
    })
  })

  describe('cssStyleValueToString', () => {
    it('对于null或undefined应该返回空字符串', () => {
      expect(DomHelper.cssStyleValueToString(null as any)).toBe('')
      expect(DomHelper.cssStyleValueToString(undefined as any)).toBe('')
    })

    it('对于字符串应该原样返回', () => {
      expect(DomHelper.cssStyleValueToString('color: red')).toBe('color: red')
    })

    it('对于非对象值应该返回空字符串', () => {
      expect(DomHelper.cssStyleValueToString(123 as any)).toBe('')
      expect(DomHelper.cssStyleValueToString(true as any)).toBe('')
    })

    it('应该将对象转换为样式字符串', () => {
      const styleObj = { color: 'red', fontSize: '14px', backgroundColor: 'blue' }
      const result = DomHelper.cssStyleValueToString(styleObj)
      expect(result).toBe('color: red; font-size: 14px; background-color: blue')
    })

    it('应该忽略对象中的无效值', () => {
      const styleObj = { color: 'red', fontSize: null, backgroundColor: 'blue', invalid: undefined }
      const result = DomHelper.cssStyleValueToString(styleObj as any)
      expect(result).toBe('color: red; background-color: blue')
    })

    it('应该处理数字值', () => {
      const styleObj: StyleRules = { fontSize: '14', opacity: 0.5 }
      const result = DomHelper.cssStyleValueToString(styleObj)
      expect(result).toBe('font-size: 14; opacity: 0.5')
    })

    it('应该使用toRaw来解包值', () => {
      const mockValue = ref('red')

      const styleObj = { color: mockValue }
      const result = DomHelper.cssStyleValueToString(styleObj)
      expect(result).toBe('color: red')
    })
  })

  describe('cssStyleValueToObject', () => {
    it('应该将字符串样式解析为对象', () => {
      const result = DomHelper.cssStyleValueToObject(
        'color: red; font-size: 14px; background-color: blue'
      )
      expect(result).toEqual({ color: 'red', fontSize: '14px', backgroundColor: 'blue' })
    })

    it('应该原样返回对象', () => {
      const styleObj = { color: 'red', fontSize: '14px' }
      const result = DomHelper.cssStyleValueToObject(styleObj)
      expect(result).toBe(styleObj)
    })

    it('对于非字符串和非对象值应该返回空对象', () => {
      expect(DomHelper.cssStyleValueToObject(123 as any)).toEqual({})
      expect(DomHelper.cssStyleValueToObject(true as any)).toEqual({})
      expect(DomHelper.cssStyleValueToObject(null as any)).toEqual({})
    })

    it('应该处理空字符串', () => {
      expect(DomHelper.cssStyleValueToObject('')).toEqual({})
    })

    it('应该忽略格式错误的样式规则', () => {
      const result = DomHelper.cssStyleValueToObject('color: red; invalid; background-color: blue')
      expect(result).toEqual({ color: 'red', backgroundColor: 'blue' })
    })

    it('应该使用toCamelCase处理属性名', () => {
      const result = DomHelper.cssStyleValueToObject('font-size: 14px; background-color: blue')
      expect(result).toEqual({ fontSize: '14px', backgroundColor: 'blue' })
    })
  })

  describe('cssClassValueToArray', () => {
    it('应该将字符串分割为数组', () => {
      const result = DomHelper.cssClassValueToArray('class1 class2  class3')
      expect(result).toEqual(['class1', 'class2', 'class3'])
    })

    it('应该原样返回数组', () => {
      const result = DomHelper.cssClassValueToArray(['class1', 'class2'])
      expect(result).toEqual(['class1', 'class2'])
    })

    it('应该将对象转换为truthy键名数组', () => {
      const result = DomHelper.cssClassValueToArray({ class1: true, class2: false, class3: true })
      expect(result).toEqual(['class1', 'class3'])
    })

    it('对于其他类型应该返回空数组', () => {
      expect(DomHelper.cssClassValueToArray(123 as any)).toEqual([])
      expect(DomHelper.cssClassValueToArray(true as any)).toEqual([])
      expect(DomHelper.cssClassValueToArray(null as any)).toEqual([])
    })
  })

  describe('cssClassValueToString', () => {
    it('应该去除字符串输入的首尾空格', () => {
      const result = DomHelper.cssClassValueToString('  class1 class2  ')
      expect(result).toBe('class1 class2')
    })

    it('应该连接数组元素并过滤空值', () => {
      const result = DomHelper.cssClassValueToString(['class1', ' ', 'class2', ''])
      expect(result).toBe('class1 class2')
    })

    it('应该连接对象的truthy键名', () => {
      const result = DomHelper.cssClassValueToString({ class1: true, class2: false, class3: true })
      expect(result).toBe('class1 class3')
    })

    it('对于其他类型应该返回空字符串', () => {
      expect(DomHelper.cssClassValueToString(123 as any)).toBe('')
      expect(DomHelper.cssClassValueToString(true as any)).toBe('')
      expect(DomHelper.cssClassValueToString(null as any)).toBe('')
    })
  })

  describe('extractEventOptions', () => {
    it('应该提取基本事件名', () => {
      const result = DomHelper.extractEventOptions('click')
      expect(result).toEqual({ event: 'click', options: {} })
    })

    it('应该处理on前缀', () => {
      const result = DomHelper.extractEventOptions('onclick')
      expect(result).toEqual({ event: 'click', options: {} })
    })

    it('应该处理capture选项', () => {
      const result = DomHelper.extractEventOptions('onClickCapture')
      expect(result).toEqual({ event: 'click', options: { capture: true } })
    })

    it('应该处理once选项', () => {
      const result = DomHelper.extractEventOptions('onClickOnce')
      expect(result).toEqual({ event: 'click', options: { once: true } })
    })

    it('应该处理passive选项', () => {
      const result = DomHelper.extractEventOptions('onClickPassive')
      expect(result).toEqual({ event: 'click', options: { passive: true } })
    })

    it('应该处理多个选项', () => {
      const result = DomHelper.extractEventOptions('onClickCaptureOnce')
      expect(result).toEqual({ event: 'click', options: { capture: true, once: true } })
    })
  })

  describe('DOM操作方法', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
    })

    describe('setStyle', () => {
      it('应该设置样式cssText', () => {
        DomHelper.setStyle(element, { color: 'red', fontSize: '14px' })
        expect(element.style.cssText).toBe('color: red; font-size: 14px;')
      })

      it('当没有样式时应该移除style属性', () => {
        element.style.cssText = 'color: red'
        DomHelper.setStyle(element, {})
        expect(element.getAttribute('style')).toBeNull()
      })
    })

    describe('setClass', () => {
      it('应该设置class属性', () => {
        DomHelper.setClass(element, 'class1 class2')
        expect(element.className).toBe('class1 class2')
      })

      it('当没有class时应该移除class属性', () => {
        element.className = 'class1'
        DomHelper.setClass(element, '')
        expect(element.getAttribute('class')).toBeNull()
      })
    })

    describe('setAttribute', () => {
      it('应该处理特殊属性', () => {
        DomHelper.setAttribute(element, 'class', 'test-class')
        expect(element.className).toBe('test-class')

        DomHelper.setAttribute(element, 'style', { color: 'red' })
        expect(element.style.cssText).toBe('color: red;')
      })

      it('应该处理事件属性', () => {
        const handler = vi.fn()
        DomHelper.setAttribute(element, 'onclick', handler)
        element.dispatchEvent(new MouseEvent('click'))
        expect(handler).toHaveBeenCalled()
      })

      it('应该处理data属性', () => {
        DomHelper.setAttribute(element, 'data-test', 'value')
        expect(element.dataset.test).toBe('value')
      })

      it('应该处理普通属性', () => {
        DomHelper.setAttribute(element, 'id', 'test-id')
        expect(element.id).toBe('test-id')
      })

      it('应该使用unref处理值', () => {
        const refValue = ref('test')
        DomHelper.setAttribute(element, 'id', refValue)
        expect(element.id).toBe('test')
      })
    })

    describe('setAttributes', () => {
      it('应该设置多个属性', () => {
        DomHelper.setAttributes(element, {
          id: 'test',
          class: 'test-class',
          'data-value': 'data'
        })

        expect(element.id).toBe('test')
        expect(element.className).toBe('test-class')
        expect(element.dataset.value).toBe('data')
      })
    })

    describe('removeAttribute', () => {
      it('应该移除class属性', () => {
        element.className = 'test'
        DomHelper.removeAttribute(element, 'class')
        expect(element.className).toBe('')
      })

      it('应该移除事件监听器', () => {
        const handler = vi.fn()
        element.addEventListener = vi.fn()
        element.removeEventListener = vi.fn()

        DomHelper.setAttribute(element, 'onclick', handler)
        DomHelper.removeAttribute(element, 'onclick', handler)

        expect(element.removeEventListener).toHaveBeenCalled()
      })
    })

    describe('addEventListener', () => {
      it('应该添加带选项的事件监听器', () => {
        const handler = vi.fn()
        element.addEventListener = vi.fn()

        DomHelper.addEventListener(element, 'onClickCapture', handler)

        expect(element.addEventListener).toHaveBeenCalledWith('click', handler, { capture: true })
      })
    })

    describe('removeEventListener', () => {
      it('应该移除带选项的事件监听器', () => {
        const handler = vi.fn()
        element.removeEventListener = vi.fn()

        DomHelper.removeEventListener(element, 'onClickCapture', handler)

        expect(element.removeEventListener).toHaveBeenCalledWith('click', handler, true)
      })
    })
  })

  describe('DOM导航方法', () => {
    let parent: HTMLElement
    let child1: HTMLElement
    let child2: HTMLElement

    beforeEach(() => {
      parent = document.createElement('div')
      child1 = document.createElement('span')
      child2 = document.createElement('p')
      parent.appendChild(child1)
      parent.appendChild(child2)
    })

    describe('insertBefore', () => {
      it('应该在锚点元素前插入元素', () => {
        const newElement = document.createElement('div')
        DomHelper.insertBefore(newElement, child2)

        expect(parent.children[1]).toBe(newElement)
        expect(parent.children[2]).toBe(child2)
      })
    })

    describe('insertAfter', () => {
      it('应该在锚点元素后插入元素', () => {
        const newElement = document.createElement('div')
        DomHelper.insertAfter(newElement, child1)

        expect(parent.children[1]).toBe(newElement)
        expect(parent.children[2]).toBe(child2)
      })
    })
    describe('getParentElement', () => {
      it('应该返回元素的父元素', () => {
        expect(DomHelper.getParentElement(child1)).toBe(parent)
      })
    })
    describe('getFirstChildElement', () => {
      it('应该返回元素的第一个子元素', () => {
        expect(DomHelper.getFirstChildElement(parent)).toBe(child1)
      })
    })
    describe('getLastChildElement', () => {
      it('应该返回元素的最后一个子元素', () => {
        expect(DomHelper.getLastChildElement(parent)).toBe(child2)
      })
    })
    describe('appendChild', () => {
      it('应该在元素末尾添加子元素', () => {
        const newElement = document.createElement('div')
        DomHelper.appendChild(parent, newElement)

        expect(parent.children[2]).toBe(newElement)
      })
      it('支持片段元素追加到片段元素', () => {
        const fragment1 = createElement(() => {
          return createElement(Fragment)
        }).element
        const fragment2 = createElement(() => {
          return createElement(Fragment, null, createElement('text-node', { children: 'test' }))
        }).element
        const body = document.createElement('div')
        DomHelper.appendChild(body, fragment1)
        DomHelper.appendChild(fragment1, fragment2)
        expect(body.textContent).toBe('test')
      })
    })
  })
})
