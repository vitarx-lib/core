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
    it('应该在锚点后插入节点', () => {
      const anchor = renderer.createElement('div', false)
      const child = renderer.createElement('span', false)
      container.appendChild(anchor)
      renderer.insert(child, anchor)
      expect(container.lastChild).toBe(child)
      expect(container.firstChild).toBe(anchor)
    })

    it('应该处理Fragment作为锚点的情况', () => {
      const fragment = renderer.createFragment({ kind: ViewKind.FRAGMENT, children: [] } as any)
      const child = renderer.createElement('div', false)
      container.appendChild(fragment.$startAnchor)
      container.appendChild(fragment.$endAnchor)
      renderer.insert(child, fragment)
      expect(container.lastChild).toBe(child)
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

    it('应该设置v-html属性', () => {
      const el = renderer.createElement('div', false)
      renderer.setAttribute(el, 'v-html', '<span>test</span>', null)
      expect(el.innerHTML).toBe('<span>test</span>')
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
})
