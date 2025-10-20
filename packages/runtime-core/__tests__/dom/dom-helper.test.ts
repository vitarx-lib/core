import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement, DomHelper, Fragment, type FragmentElement } from '../../src'

describe('DomHelper', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  describe('已弃用的方法', () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement('div')
    })

    describe('mergeCssClass', () => {
      it('应该调用StyleHandler.mergeCssClass', () => {
        const c1 = 'class1'
        const c2 = 'class2'
        const result = DomHelper.mergeCssClass(c1, c2)

        expect(result).toEqual([c1, c2])
      })
    })

    describe('mergeCssStyle', () => {
      it('应该调用StyleHandler.mergeCssStyle', () => {
        const style1 = { color: 'red' }
        const style2 = { fontSize: '14px' }
        const result = DomHelper.mergeCssStyle(style1, style2)

        expect(result).toEqual({ color: 'red', fontSize: '14px' })
      })
    })

    describe('cssStyleValueToString', () => {
      it('应该调用StyleHandler.cssStyleValueToString', () => {
        const style = { color: 'red', fontSize: '14px' }
        const result = DomHelper.cssStyleValueToString(style)

        expect(result).toBe('color: red; font-size: 14px;')
      })
    })

    describe('cssStyleValueToObject', () => {
      it('应该调用StyleHandler.cssStyleValueToObject', () => {
        const style = { color: 'red', fontSize: '14px' }
        const result = DomHelper.cssStyleValueToObject(style)

        expect(result).toEqual(style)
      })
    })

    describe('cssClassValueToArray', () => {
      it('应该调用StyleHandler.cssClassValueToArray', () => {
        const classInput = 'class1 class2'
        const result = DomHelper.cssClassValueToArray(classInput)

        expect(result).toEqual(['class1', 'class2'])
      })
    })

    describe('cssClassValueToString', () => {
      it('应该调用StyleHandler.cssClassValueToString', () => {
        const classInput = ['class1', 'class2']
        const result = DomHelper.cssClassValueToString(classInput)

        expect(result).toBe('class1 class2')
      })
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

    it('应该处理所有选项组合', () => {
      const result = DomHelper.extractEventOptions('onMouseDownCaptureOncePassive')
      expect(result).toEqual({
        event: 'mousedown',
        options: { capture: true, once: true, passive: true }
      })
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

      it('应该移除undefined值的属性', () => {
        element.setAttribute('id', 'test')
        DomHelper.setAttribute(element, 'id', undefined)
        expect(element.getAttribute('id')).toBe('')
      })

      it('应该处理v-html属性', () => {
        DomHelper.setAttribute(element, 'v-html', '<p>test</p>')
        expect(element.innerHTML).toBe('<p>test</p>')
      })

      it('应该处理autoFocus属性', () => {
        DomHelper.setAttribute(element, 'autoFocus', true)
        expect(element.autofocus).toBe(true)
      })

      it('应该处理xmlns:xlink属性', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        DomHelper.setAttribute(svg, 'xmlns:xlink', 'http://www.w3.org/1999/xlink')
        expect(svg.getAttribute('xmlns:xlink')).toBe('http://www.w3.org/1999/xlink')
      })

      it('应该处理xlink属性', () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
        svg.appendChild(use)
        DomHelper.setAttribute(use, 'xlink:href', '#test')
        expect(use.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#test')
      })

      it('应该直接设置元素属性', () => {
        DomHelper.setAttribute(element, 'title', 'test title')
        expect(element.title).toBe('test title')
      })

      it('应该处理属性设置错误', () => {
        // 创建一个会导致错误的属性设置场景
        Object.defineProperty(element, 'testProp', {
          set: () => {
            throw new Error('Test error')
          }
        })

        DomHelper.setAttribute(element, 'testProp', 'value')
        expect(DomHelper.getAttribute(element, 'testProp')).toBe('value')
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
        const addEventListenerSpy = vi.spyOn(element, 'addEventListener')
        const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

        DomHelper.setAttribute(element, 'onclick', handler)
        DomHelper.removeAttribute(element, 'onclick', handler)

        expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, {})
        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, false)
        addEventListenerSpy.mockRestore()
        removeEventListenerSpy.mockRestore()
      })

      it('应该处理字符串属性', () => {
        element.setAttribute('id', 'test')
        DomHelper.removeAttribute(element, 'id')
        expect(element.id).toBe('')
      })

      it('应该处理布尔属性', () => {
        const input = document.createElement('input')
        input.disabled = true
        DomHelper.removeAttribute(input, 'disabled')
        expect(input.disabled).toBe(false)
      })

      it('应该处理数字属性', () => {
        const input = document.createElement('input')
        input.maxLength = 10
        DomHelper.removeAttribute(input, 'maxLength')
        expect(input.maxLength).toBe(-1)
      })

      it('应该处理tabIndex属性', () => {
        element.tabIndex = 1
        DomHelper.removeAttribute(element, 'tabIndex')
        expect(element.tabIndex).toBe(-1)
      })

      it('应该移除普通属性', () => {
        element.setAttribute('custom-attr', 'value')
        DomHelper.removeAttribute(element, 'custom-attr')
        expect(element.getAttribute('custom-attr')).toBeNull()
      })
    })

    describe('getAttribute', () => {
      it('应该获取元素的属性值', () => {
        element.setAttribute('id', 'test')
        expect(DomHelper.getAttribute(element, 'id')).toBe('test')
      })

      it('应该在属性不存在时返回null', () => {
        expect(DomHelper.getAttribute(element, 'nonexistent')).toBeNull()
      })
    })

    describe('addEventListener', () => {
      it('应该添加带选项的事件监听器', () => {
        const handler = vi.fn()
        const addEventListenerSpy = vi.spyOn(element, 'addEventListener')

        DomHelper.addEventListener(element, 'onClickCapture', handler)

        expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, { capture: true })
        addEventListenerSpy.mockRestore()
      })

      it('应该合并选项', () => {
        const handler = vi.fn()
        const addEventListenerSpy = vi.spyOn(element, 'addEventListener')

        DomHelper.addEventListener(element, 'onClick', handler, { once: true })

        expect(addEventListenerSpy).toHaveBeenCalledWith('click', handler, { once: true })
        addEventListenerSpy.mockRestore()
      })
    })

    describe('removeEventListener', () => {
      it('应该移除带选项的事件监听器', () => {
        const handler = vi.fn()
        const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

        DomHelper.removeEventListener(element, 'onClickCapture', handler)

        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, true)
        removeEventListenerSpy.mockRestore()
      })

      it('应该使用useCapture参数', () => {
        const handler = vi.fn()
        const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener')

        DomHelper.removeEventListener(element, 'onClick', handler, true)

        expect(removeEventListenerSpy).toHaveBeenCalledWith('click', handler, true)
        removeEventListenerSpy.mockRestore()
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

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(
            Fragment,
            null,
            createElement('span', { children: 'fragment content' })
          )
        }).element
        const newElement = document.createElement('div')
        newElement.textContent = 'new element'

        document.body.appendChild(fragment)
        DomHelper.insertBefore(newElement, fragment)

        expect(document.body.children[0]).toBe(newElement)
        expect(document.body.childNodes.length).toBe(4)
        expect(document.body.childNodes[2]).instanceOf(HTMLSpanElement)
        expect(document.body.children[1]).instanceOf(HTMLSpanElement)
      })

      it('应该在锚点元素没有父节点时抛出错误', () => {
        const newElement = document.createElement('div')
        const orphanElement = document.createElement('div')

        expect(() => {
          DomHelper.insertBefore(newElement, orphanElement)
        }).toThrow(
          '[Vitarx.DomHelper.insertBefore][ERROR]: The anchor element does not have a parent node'
        )
      })
    })

    describe('insertAfter', () => {
      it('应该在锚点元素后插入元素', () => {
        const newElement = document.createElement('div')
        DomHelper.insertAfter(newElement, child1)

        expect(parent.children[1]).toBe(newElement)
        expect(parent.children[2]).toBe(child2)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(
            Fragment,
            null,
            createElement('span', { children: 'fragment content' })
          )
        }).element

        const newElement = document.createElement('div')
        newElement.textContent = 'new element'

        document.body.appendChild(fragment)
        DomHelper.insertAfter(newElement, fragment)

        expect(document.body.children[0]).instanceOf(HTMLSpanElement)
        expect(document.body.children[1]).toBe(newElement)
      })

      it('应该在锚点元素没有父节点时抛出错误', () => {
        const newElement = document.createElement('div')
        const orphanElement = document.createElement('div')

        expect(() => {
          DomHelper.insertAfter(newElement, orphanElement)
        }).toThrow(
          '[Vitarx.DomHelper.insertAfter][ERROR]: The anchor element does not have a parent node'
        )
      })
    })

    describe('getParentElement', () => {
      it('应该返回元素的父元素', () => {
        expect(DomHelper.getParentElement(child1)).toBe(parent)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span'))
        }).element

        document.body.appendChild(fragment)
        expect(DomHelper.getParentElement(fragment)).toBe(document.body)
      })

      it('应该在没有父元素时返回null', () => {
        const orphanElement = document.createElement('div')
        expect(DomHelper.getParentElement(orphanElement)).toBeNull()
      })
    })

    describe('getNextElement', () => {
      it('应该返回下一个兄弟节点', () => {
        expect(DomHelper.getNextElement(child1)).toBe(child2)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span'))
        }).element

        parent.appendChild(fragment)
        const lastElement = document.createElement('div')
        parent.appendChild(lastElement)

        expect(DomHelper.getNextElement(fragment)).toBe(lastElement)
      })

      it('应该在没有下一个兄弟节点时返回null', () => {
        expect(DomHelper.getNextElement(child2)).toBeNull()
      })
    })

    describe('getPrevElement', () => {
      it('应该返回前一个兄弟节点', () => {
        expect(DomHelper.getPrevElement(child2)).toBe(child1)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span'))
        }).element as FragmentElement

        parent.insertBefore(fragment, child2)
        expect(DomHelper.getPrevElement(child2)).toBe(fragment.$endAnchor)
      })

      it('应该在没有前一个兄弟节点时返回null', () => {
        expect(DomHelper.getPrevElement(child1)).toBeNull()
      })
    })

    describe('getLastChildElement', () => {
      it('应该返回最后一个子元素', () => {
        expect(DomHelper.getLastChildElement(parent)).toBe(child2)
      })

      it('应该处理Fragment元素', () => {
        const lastChild = createElement('span')
        const fragment = createElement(() => {
          return createElement(Fragment, null, lastChild)
        }).element

        expect(DomHelper.getLastChildElement(fragment)).toBe(lastChild.element)
      })
    })

    describe('getFirstChildElement', () => {
      it('应该返回第一个子元素', () => {
        expect(DomHelper.getFirstChildElement(parent)).toBe(child1)
      })

      it('应该处理Fragment元素', () => {
        const firstChild = createElement('span')
        const fragment = createElement(() => {
          return createElement(Fragment, null, firstChild)
        }).element as FragmentElement

        expect(DomHelper.getFirstChildElement(fragment)).toBe(firstChild.element)
      })
    })

    describe('replace', () => {
      it('应该替换元素', () => {
        const newElement = document.createElement('section')
        newElement.textContent = 'new element'
        DomHelper.replace(newElement, child1)

        expect(parent.children[0]).toBe(newElement)
        expect(parent.children[1]).toBe(child2)
        expect(parent.children.length).toBe(2)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span', { children: 'fragment' }))
        }).element

        const newElement = document.createElement('div')
        newElement.textContent = 'new element'

        document.body.appendChild(fragment)
        DomHelper.replace(newElement, fragment)

        expect(document.body.children[0]).toBe(newElement)
        expect(document.body.children.length).toBe(1)
      })

      it('应该在旧元素没有父节点时抛出错误', () => {
        const newElement = document.createElement('div')
        const orphanElement = document.createElement('div')

        expect(() => {
          DomHelper.replace(newElement, orphanElement)
        }).toThrow(
          '[Vitarx.DomHelper.replace][ERROR]: The old element does not have a parent element'
        )
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

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment)
        }).element

        const childElement = document.createElement('div')
        childElement.textContent = 'child'

        DomHelper.appendChild(fragment, childElement)
        DomHelper.appendChild(parent, fragment)

        expect(parent.children.length).toBe(3)
        expect(parent.textContent).toBe('child')
      })
    })

    describe('remove', () => {
      it('应该移除元素', () => {
        DomHelper.remove(child1 as any)
        expect(parent.children.length).toBe(1)
        expect(parent.children[0]).toBe(child2)
      })

      it('应该处理Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span', { children: 'fragment' }))
        }).element

        parent.appendChild(fragment)
        expect(parent.childNodes.length).toBe(5)

        DomHelper.remove(fragment)
        expect(parent.childNodes.length).toBe(2)
      })
    })

    describe('recoveryFragmentChildNodes', () => {
      it('应该恢复Fragment子节点', () => {
        const fragment = createElement(() => {
          return createElement(Fragment, null, createElement('span', { children: 'test' }))
        }).element

        // 清空Fragment的子节点来模拟需要恢复的情况
        while (fragment.firstChild) {
          fragment.removeChild(fragment.firstChild)
        }

        expect(fragment.childNodes.length).toBe(0)
        DomHelper.recoveryFragmentChildNodes(fragment)
        expect(fragment.childNodes.length).toBe(3) // startAnchor, span, endAnchor
        expect(fragment.textContent).toBe('test')
      })

      it('应该处理非Fragment元素', () => {
        const element = document.createElement('div')
        element.textContent = 'test'

        const result = DomHelper.recoveryFragmentChildNodes(element)
        expect(result).toBe(element)
        expect(element.textContent).toBe('test')
      })
    })

    describe('isFragmentElement', () => {
      it('应该识别Fragment元素', () => {
        const fragment = createElement(() => {
          return createElement(Fragment)
        }).element

        expect(DomHelper.isFragmentElement(fragment)).toBe(true)
      })

      it('应该识别非Fragment元素', () => {
        const element = document.createElement('div')
        expect(DomHelper.isFragmentElement(element)).toBe(false)
      })

      it('应该处理null和undefined', () => {
        expect(DomHelper.isFragmentElement(null)).toBe(false)
        expect(DomHelper.isFragmentElement(undefined)).toBe(false)
      })
    })
  })
})
