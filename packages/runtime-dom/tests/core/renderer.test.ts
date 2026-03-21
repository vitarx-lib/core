import { ViewKind } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMRenderer } from '../../src/index.js'

describe('DOMRenderer', () => {
  let renderer: DOMRenderer
  let container: HTMLElement

  beforeEach(() => {
    renderer = new DOMRenderer()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  describe('性能测试', () => {
    it('创建大量元素的性能', () => {
      const startTime = performance.now()
      const elements = []
      for (let i = 0; i < 1000; i++) {
        elements.push(renderer.createElement('div', false))
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
      expect(elements.length).toBe(1000)
    })

    it('批量设置属性的性能', () => {
      const el = renderer.createElement('div', false)
      const startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
        renderer.setAttribute(el, `data-test-${i}`, `value-${i}`, null)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('批量插入节点的性能', () => {
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        const child = renderer.createElement('div', false)
        renderer.append(child, container)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
      expect(container.children.length).toBe(100)
    })

    it('创建Fragment的性能', () => {
      const startTime = performance.now()
      const fragments = []
      for (let i = 0; i < 100; i++) {
        fragments.push(renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any))
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
      expect(fragments.length).toBe(100)
    })
  })

  describe('isSVGElement', () => {
    it('应该正确识别SVG元素', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      expect(renderer.isSVGElement(svg)).toBe(true)
    })

    it('应该正确识别非SVG元素', () => {
      const div = document.createElement('div')
      expect(renderer.isSVGElement(div)).toBe(false)
    })

    it('应该正确处理foreignObject元素', () => {
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
      expect(renderer.isSVGElement(foreignObject)).toBe(false)
    })

    it('应该正确处理null节点', () => {
      expect(renderer.isSVGElement(null as any)).toBe(false)
    })

    it('应该正确处理文本节点', () => {
      const text = document.createTextNode('test')
      expect(renderer.isSVGElement(text)).toBe(false)
    })
  })

  describe('createElement', () => {
    it('应该创建普通HTML元素', () => {
      const div = renderer.createElement('div', false)
      expect(div.tagName).toBe('DIV')
      expect(div.namespaceURI).toBe('http://www.w3.org/1999/xhtml')
    })

    it('应该创建SVG元素', () => {
      const svg = renderer.createElement('svg', true)
      expect(svg.tagName.toLowerCase()).toBe('svg')
      expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg')
    })
  })

  describe('createComment', () => {
    it('应该创建注释节点', () => {
      const comment = renderer.createComment('test comment')
      expect(comment.nodeType).toBe(Node.COMMENT_NODE)
      expect(comment.nodeValue).toBe('test comment')
    })
  })

  describe('createText', () => {
    it('应该创建文本节点', () => {
      const text = renderer.createText('test text')
      expect(text.nodeType).toBe(Node.TEXT_NODE)
      expect(text.nodeValue).toBe('test text')
    })
  })

  describe('createFragment', () => {
    it('应该创建文档片段', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      expect(fragment.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE)
      expect(fragment.$startAnchor.nodeType).toBe(Node.COMMENT_NODE)
      expect(fragment.$endAnchor.nodeType).toBe(Node.COMMENT_NODE)
    })
  })

  describe('append', () => {
    it('应该将子节点添加到父节点', () => {
      const child = renderer.createElement('div', false)
      renderer.append(child, container)
      expect(container.contains(child)).toBe(true)
    })
  })

  describe('insert', () => {
    it('应该在锚点前插入节点', () => {
      const anchor = renderer.createElement('div', false)
      const child = renderer.createElement('span', false)
      container.appendChild(anchor)
      renderer.insert(child, anchor)
      expect(container.lastChild).toBe(anchor)
      expect(container.firstChild).toBe(child)
    })

    it('应该处理Fragment作为锚点的情况', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      const child = renderer.createElement('div', false)
      container.appendChild(fragment.$startAnchor)
      container.appendChild(fragment.$endAnchor)
      renderer.insert(child, fragment)
      expect(container.firstChild).toBe(child)
    })
  })

  describe('remove', () => {
    it('应该移除普通节点', () => {
      const child = renderer.createElement('div', false)
      container.appendChild(child)
      renderer.remove(child)
      expect(container.contains(child)).toBe(false)
    })

    it('应该移除Fragment节点', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      const child = renderer.createElement('div', false)
      renderer.append(child, fragment)
      renderer.append(fragment, container)
      renderer.remove(fragment)
      expect(container.contains(fragment)).toBe(false)
    })
  })

  describe('replace', () => {
    it('应该替换普通节点', () => {
      const oldNode = renderer.createElement('div', false)
      const newNode = renderer.createElement('span', false)
      container.appendChild(oldNode)
      renderer.replace(newNode, oldNode)
      expect(container.contains(oldNode)).toBe(false)
      expect(container.contains(newNode)).toBe(true)
    })

    it('应该替换Fragment节点', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      const newNode = renderer.createElement('div', false)
      renderer.append(fragment, container)
      renderer.replace(newNode, fragment)
      expect(container.contains(fragment)).toBe(false)
      expect(container.contains(newNode)).toBe(true)
    })
  })

  describe('setAttribute', () => {
    it('应该设置普通属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'id', 'test-id', null)
      expect(el.getAttribute('id')).toBe('test-id')
    })

    it('应该设置data属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'data-test', 'value', null)
      expect(el.dataset.test).toBe('value')
    })

    it('应该设置xlink属性', () => {
      const svg = renderer.createElement('svg', true)
      renderer.setAttribute(svg, 'xlink:href', '#test', null)
      expect(svg.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe('#test')
    })

    it('应该设置class属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'class', 'test-class', null)
      expect(el.className).toBe('test-class')
    })

    it('应该设置style属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'style', { color: 'red' }, null)
      expect(el.style.color).toBe('red')
    })

    it('应该设置autoFocus属性', () => {
      const el = renderer.createElement('input', false)
      renderer.setAttribute(el, 'autoFocus', true, null)
      expect(el.autofocus).toBe(true)
    })

    it('应该处理事件属性', () => {
      const el = renderer.createElement('div', false)
      const handler = vi.fn()
      renderer.setAttribute(el, 'onClick', handler, null)
      el.click()
      expect(handler).toHaveBeenCalled()
    })

    it('应该移除属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'id', 'test-id', null)
      renderer.setAttribute(el, 'id', null, 'test-id')
      expect(el.getAttribute('id')).toBe('')
    })
  })

  describe('setText', () => {
    it('应该设置文本内容', () => {
      const el = renderer.createElement('div', false)
      renderer.setText(el, 'test text')
      expect(el.textContent).toBe('test text')
    })
  })

  describe('isElement', () => {
    it('应该正确识别元素节点', () => {
      const el = renderer.createElement('div', false)
      expect(renderer.isElement(el)).toBe(true)
    })

    it('应该正确识别非元素节点', () => {
      const text = renderer.createText('test')
      expect(renderer.isElement(text)).toBe(false)
    })
  })

  describe('isFragment', () => {
    it('应该正确识别Fragment节点', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      expect(renderer.isFragment(fragment)).toBe(true)
    })

    it('应该正确识别非Fragment节点', () => {
      const el = renderer.createElement('div', false)
      expect(renderer.isFragment(el)).toBe(false)
    })
  })

  describe('属性操作性能优化验证', () => {
    it('预定义默认值应避免创建元素', () => {
      const input = renderer.createElement('input', false)
      renderer.setAttribute(input, 'checked', true, null)
      expect(input.checked).toBe(true)
      renderer.setAttribute(input, 'checked', null, true)
      expect(input.checked).toBe(false)
    })

    it('按需重置策略：未设置过的属性不应触发默认值查询', () => {
      const el = renderer.createElement('input', false)
      const startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
        renderer.setAttribute(el, `custom-attr-${i}`, null, undefined)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('批量设置和移除属性性能', () => {
      const el = renderer.createElement('input', false)
      const iterations = 500
      const startTime = performance.now()
      for (let i = 0; i < iterations; i++) {
        renderer.setAttribute(el, 'checked', true, null)
        renderer.setAttribute(el, 'checked', null, true)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('常见属性设置性能', () => {
      const el = renderer.createElement('input', false)
      const attrs = ['disabled', 'readOnly', 'required', 'autofocus', 'hidden']
      const startTime = performance.now()
      for (let i = 0; i < 1000; i++) {
        for (const attr of attrs) {
          renderer.setAttribute(el, attr, true, null)
          renderer.setAttribute(el, attr, false, true)
        }
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200)
    })

    it('value属性重置性能', () => {
      const el = renderer.createElement('input', false) as HTMLInputElement
      const startTime = performance.now()
      for (let i = 0; i < 500; i++) {
        renderer.setAttribute(el, 'value', `test-${i}`, null)
        renderer.setAttribute(el, 'value', null, `test-${i}`)
      }
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
      expect(el.value).toBe('')
    })
  })
})
