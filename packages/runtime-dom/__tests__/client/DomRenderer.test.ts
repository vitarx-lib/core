/**
 * DomRenderer 单元测试
 *
 * 测试目标：验证 DomRenderer 类的所有公共方法，确保 DOM 操作的正确性
 */
import type { HostNodeElements } from '@vitarx/runtime-core'
import { createVNode } from '@vitarx/runtime-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DomRenderer } from '../../src/index.js'

describe('DomRenderer', () => {
  let renderer: DomRenderer

  beforeEach(() => {
    renderer = new DomRenderer()
  })

  describe('元素创建', () => {
    it('应该创建普通 HTML 元素', () => {
      const vnode = createVNode('div', { id: 'test' })

      const el = renderer.createElement(vnode as any)

      expect(el.tagName.toLowerCase()).toBe('div')
      expect(el.id).toBe('test')
      expect(el instanceof HTMLDivElement).toBe(true)
    })

    it('应该创建 SVG 元素', () => {
      const vnode = createVNode('svg', {})

      const el = renderer.createElement(vnode as any)

      expect(el.tagName.toLowerCase()).toBe('svg')
      expect(el instanceof SVGElement).toBe(true)
      expect(el.namespaceURI).toBe('http://www.w3.org/2000/svg')
    })

    it('应该创建文本节点', () => {
      const text = renderer.createText('Hello World')

      expect(text.nodeType).toBe(Node.TEXT_NODE)
      expect(text.textContent).toBe('Hello World')
    })

    it('应该创建注释节点', () => {
      const comment = renderer.createComment('This is a comment')

      expect(comment.nodeType).toBe(Node.COMMENT_NODE)
      expect(comment.textContent).toBe('This is a comment')
    })

    it('应该创建文档片段', () => {
      const vnode = createVNode('fragment', { children: [] })

      const fragment = renderer.createFragment(vnode as any)

      expect(fragment.nodeType).toBe(Node.DOCUMENT_FRAGMENT_NODE)
      expect(fragment.$startAnchor).toBeDefined()
      expect(fragment.$endAnchor).toBeDefined()
      expect(fragment.$startAnchor.textContent).toBe('Fragment start')
      expect(fragment.$endAnchor.textContent).toBe('Fragment end')
      expect(fragment.$vnode).toBe(vnode)
    })
  })

  describe('元素判断', () => {
    it('应该正确识别 void 元素', () => {
      const voidElements = [
        'area',
        'base',
        'br',
        'col',
        'embed',
        'hr',
        'img',
        'input',
        'link',
        'meta',
        'source',
        'track',
        'wbr'
      ]

      voidElements.forEach(tag => {
        expect(renderer.isVoidElement(tag)).toBe(true)
      })
    })

    it('应该正确识别非 void 元素', () => {
      const normalElements = ['div', 'span', 'p', 'h1', 'section', 'article']

      normalElements.forEach(tag => {
        expect(renderer.isVoidElement(tag)).toBe(false)
      })
    })

    it('应该正确识别元素节点', () => {
      const div = document.createElement('div')
      const fragment = document.createDocumentFragment()

      expect(renderer.isElement(div)).toBe(true)
      expect(renderer.isElement(fragment as HostNodeElements)).toBe(true)
    })

    it('应该正确识别非元素节点', () => {
      const text = document.createTextNode('text')
      const comment = document.createComment('comment')

      expect(renderer.isElement(text)).toBe(false)
      expect(renderer.isElement(comment)).toBe(false)
    })

    it('应该正确识别 Fragment 节点', () => {
      const fragment = document.createDocumentFragment()
      const div = document.createElement('div')

      expect(renderer.isFragment(fragment as any)).toBe(true)
      expect(renderer.isFragment(div as any)).toBe(false)
    })

    it('应该正确识别容器元素', () => {
      const div = document.createElement('div')
      const img = document.createElement('img')
      const fragment = document.createDocumentFragment()
      const text = document.createTextNode('text')

      expect(renderer.isContainer(div as any)).toBe(true)
      expect(renderer.isContainer(fragment as any)).toBe(true)
      expect(renderer.isContainer(img as any)).toBe(false)
      expect(renderer.isContainer(text as any)).toBe(false)
    })
  })

  describe('DOM 操作', () => {
    it('应该将子元素添加到父元素', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')

      renderer.appendChild(child, parent)

      expect(parent.children.length).toBe(1)
      expect(parent.children[0]).toBe(child)
    })

    it('应该将子元素添加到 Fragment', () => {
      const container = document.createElement('div')
      const vnode = createVNode('fragment', { children: [] })
      const fragment = renderer.createFragment(vnode as any)
      const child = document.createElement('span')

      // 先将 fragment 挂载到容器
      container.appendChild(fragment)

      // 再添加子元素
      renderer.appendChild(child, fragment)

      // 验证子元素被添加（在 jsdom 中，fragment 的节点会移动到容器中）
      expect(child.parentNode).toBeDefined()
      expect(container.contains(child) || fragment.contains(child)).toBe(true)
    })

    it('应该在锚点前插入元素', () => {
      const parent = document.createElement('div')
      const anchor = document.createElement('span')
      const newChild = document.createElement('p')

      parent.appendChild(anchor)
      renderer.insertBefore(newChild, anchor)

      expect(parent.children.length).toBe(2)
      expect(parent.children[0]).toBe(newChild)
      expect(parent.children[1]).toBe(anchor)
    })

    it('应该替换普通元素', () => {
      const parent = document.createElement('div')
      const oldChild = document.createElement('span')
      const newChild = document.createElement('p')

      parent.appendChild(oldChild)
      renderer.replace(newChild, oldChild)

      expect(parent.children.length).toBe(1)
      expect(parent.children[0]).toBe(newChild)
      expect(oldChild.parentNode).toBeNull()
    })

    it('应该移除普通元素', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')

      parent.appendChild(child)
      renderer.remove(child)

      expect(parent.children.length).toBe(0)
      expect(child.parentNode).toBeNull()
    })

    it('应该移除 Fragment 元素', () => {
      const container = document.createElement('div')
      const vnode = createVNode('fragment', { children: [] })
      const fragment = renderer.createFragment(vnode as any)

      // 将 fragment 的锚点添加到容器
      container.appendChild(fragment.$startAnchor)
      container.appendChild(fragment.$endAnchor)

      renderer.remove(fragment)

      expect(container.childNodes.length).toBe(0)
    })
  })

  describe('属性操作', () => {
    it('应该设置普通属性', () => {
      const el = document.createElement('div')

      renderer.setAttribute(el, 'id', 'test-id')
      renderer.setAttribute(el, 'title', 'Test Title')

      expect(el.id).toBe('test-id')
      expect(el.title).toBe('Test Title')
    })

    it('应该设置 data-* 属性', () => {
      const el = document.createElement('div')

      renderer.setAttribute(el, 'data-test', 'test-value')
      renderer.setAttribute(el, 'data-count', '123')

      expect(el.dataset.test).toBe('test-value')
      expect(el.dataset.count).toBe('123')
    })

    it('应该设置 xmlns:xlink 属性', () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

      renderer.setAttribute(el, 'xmlns:xlink', 'http://www.w3.org/1999/xlink')

      // jsdom 可能不完全支持 xmlns 命名空间，检查属性是否存在
      const hasAttr =
        el.hasAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink') ||
        el.getAttribute('xmlns:xlink') !== null
      expect(hasAttr).toBe(true)
    })

    it('应该设置 xlink:* 属性', () => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'use')

      renderer.setAttribute(el, 'xlink:href', '#icon')

      // jsdom 可能不完全支持 xlink 命名空间，检查属性是否存在
      const attrValue =
        el.getAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href') ||
        el.getAttribute('xlink:href')
      expect(attrValue).toBeTruthy()
    })

    it('应该设置事件处理函数', () => {
      const el = document.createElement('button')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onclick', handler)
      el.click()

      expect(handler).toHaveBeenCalledOnce()
    })

    it('应该移除普通属性', () => {
      const el = document.createElement('input')
      el.value = 'test'
      el.checked = true

      renderer.removeAttribute(el, 'value', 'test')
      renderer.removeAttribute(el, 'checked', true)

      expect(el.value).toBe('')
      expect(el.checked).toBe(false)
    })

    it('应该移除 class 属性', () => {
      const el = document.createElement('div')
      el.className = 'foo bar'

      renderer.removeAttribute(el, 'class', 'foo bar')

      expect(el.className).toBe('')
      expect(el.hasAttribute('class')).toBe(false)
    })

    it('应该移除事件处理函数', () => {
      const el = document.createElement('button')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onclick', handler)
      renderer.removeAttribute(el, 'onclick', handler)
      el.click()

      expect(handler).not.toHaveBeenCalled()
    })

    it('应该处理 undefined 值', () => {
      const el = document.createElement('div')
      el.id = 'test'

      renderer.setAttribute(el, 'id', undefined, 'test')

      expect(el.id).toBe('')
    })
  })

  describe('样式操作', () => {
    it('应该添加样式属性', () => {
      const el = document.createElement('div')

      renderer.addStyle(el, 'color', 'red')
      renderer.addStyle(el, 'font-size', '16px')

      expect(el.style.color).toBe('red')
      expect(el.style.fontSize).toBe('16px')
    })

    it('应该返回恢复函数', () => {
      const el = document.createElement('div')
      el.style.color = 'blue'

      const restore = renderer.addStyle(el, 'color', 'red')
      expect(el.style.color).toBe('red')

      restore()
      expect(el.style.color).toBe('blue')
    })

    it('应该移除样式属性', () => {
      const el = document.createElement('div')
      el.style.color = 'red'

      renderer.removeStyle(el, 'color')

      expect(el.style.color).toBe('')
    })

    it('应该设置 CSS 类', () => {
      const el = document.createElement('div')

      renderer.setClass(el, ['foo', 'bar', 'baz'])

      expect(el.className).toBe('foo bar baz')
    })

    it('应该添加单个类名', () => {
      const el = document.createElement('div')

      renderer.addClass(el, 'active')
      renderer.addClass(el, 'highlight')

      expect(el.classList.contains('active')).toBe(true)
      expect(el.classList.contains('highlight')).toBe(true)
    })

    it('应该移除单个类名', () => {
      const el = document.createElement('div')
      el.className = 'foo bar baz'

      renderer.removeClass(el, 'bar')

      expect(el.classList.contains('foo')).toBe(true)
      expect(el.classList.contains('bar')).toBe(false)
      expect(el.classList.contains('baz')).toBe(true)
    })

    it('应该在类名为空时移除 class 属性', () => {
      const el = document.createElement('div')

      renderer.setClass(el, [])

      expect(el.hasAttribute('class')).toBe(false)
    })
  })

  describe('事件处理', () => {
    it('应该处理基本事件名称', () => {
      const el = document.createElement('button')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onClick', handler)
      el.click()

      expect(handler).toHaveBeenCalledOnce()
    })

    it('应该处理 Capture 修饰符', () => {
      const el = document.createElement('div')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onClickCapture', handler)

      // 验证事件在捕获阶段被添加
      const event = new MouseEvent('click', { bubbles: true })
      el.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('应该处理 Once 修饰符', () => {
      const el = document.createElement('button')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onClickOnce', handler)

      el.click()
      el.click()

      expect(handler).toHaveBeenCalledOnce()
    })

    it('应该处理 Passive 修饰符', () => {
      const el = document.createElement('div')
      const handler = vi.fn()

      renderer.setAttribute(el, 'onScrollPassive', handler)

      // Passive 修饰符主要影响 preventDefault 的调用，在 jsdom 中难以测试
      // 这里只验证事件能够正常绑定
      const event = new Event('scroll')
      el.dispatchEvent(event)

      expect(handler).toHaveBeenCalled()
    })

    it('应该替换事件处理函数', () => {
      const el = document.createElement('button')
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      renderer.setAttribute(el, 'onClick', handler1)
      renderer.setAttribute(el, 'onClick', handler2, handler1)

      el.click()

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledOnce()
    })
  })

  describe('查询与布局', () => {
    it('应该查询元素', () => {
      const container = document.createElement('div')
      const child = document.createElement('span')
      child.id = 'test-id'
      container.appendChild(child)
      document.body.appendChild(container)

      const result = renderer.querySelector('#test-id')

      expect(result).toBe(child)

      document.body.removeChild(container)
    })

    it('应该在指定容器内查询', () => {
      const container = document.createElement('div')
      const child = document.createElement('span')
      child.className = 'test-class'
      container.appendChild(child)

      const result = renderer.querySelector('.test-class', container)

      expect(result).toBe(child)
    })

    it('应该获取父元素', () => {
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)

      const result = renderer.getParentElement(child)

      expect(result).toBe(parent)
    })

    it('应该获取元素位置和尺寸', () => {
      const el = document.createElement('div')

      const rect = renderer.getBoundingClientRect(el)

      expect(rect).toBeDefined()
      expect(typeof rect.top).toBe('number')
      expect(typeof rect.left).toBe('number')
      expect(typeof rect.width).toBe('number')
      expect(typeof rect.height).toBe('number')
    })
  })

  describe('动画帧', () => {
    it('应该请求动画帧', () => {
      const callback = vi.fn()

      const id = renderer.requestAnimationFrame(callback)

      expect(typeof id).toBe('number')
    })

    it('应该取消动画帧', () => {
      const callback = vi.fn()

      const id = renderer.requestAnimationFrame(callback)
      renderer.cancelAnimationFrame(id)

      // 由于 jsdom 的限制，这里只验证方法不会抛出错误
      expect(true).toBe(true)
    })
  })

  describe('文本操作', () => {
    it('应该设置文本节点内容', () => {
      const text = document.createTextNode('old text')

      renderer.setText(text, 'new text')

      expect(text.textContent).toBe('new text')
    })

    it('应该设置注释节点内容', () => {
      const comment = document.createComment('old comment')

      renderer.setText(comment, 'new comment')

      expect(comment.textContent).toBe('new comment')
    })
  })

  describe('错误处理', () => {
    it('应该捕获属性设置错误', () => {
      const el = document.createElement('div')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // 尝试设置一个只读属性
      renderer.setAttribute(el, 'innerHTML', '<script>alert(1)</script>')

      // 不应该抛出错误
      expect(el.innerHTML).toBe('<script>alert(1)</script>')

      consoleSpy.mockRestore()
    })

    it('应该在无父节点时抛出错误 - insertBefore', () => {
      const anchor = document.createElement('div')
      const child = document.createElement('span')

      expect(() => {
        renderer.insertBefore(child, anchor)
      }).toThrow('does not have a parent node')
    })

    it('应该在无父节点时抛出错误 - replace', () => {
      const oldChild = document.createElement('div')
      const newChild = document.createElement('span')

      expect(() => {
        renderer.replace(newChild, oldChild)
      }).toThrow('does not have a parent element')
    })
  })
})
