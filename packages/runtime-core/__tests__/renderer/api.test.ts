/**
 * 渲染器 API 测试
 *
 * 测试渲染器的注册和获取功能
 */

import { describe, expect, it } from 'vitest'
import type { HostRenderer } from '../../src/index.js'
import { getRenderer, setRenderer } from '../../src/index.js'

describe('渲染器 API', () => {
  describe('渲染器注册和获取', () => {
    it('应该能够设置全局渲染器', () => {
      const oldRenderer = getRenderer()
      const mockRenderer = {} as HostRenderer
      setRenderer(mockRenderer)
      expect(getRenderer()).toBe(mockRenderer)
      setRenderer(oldRenderer)
      expect(getRenderer()).toBe(oldRenderer)
    })

    it('应该能够获取当前渲染器', () => {
      const renderer = getRenderer()

      expect(renderer).toBeDefined()
    })

    it('应该能够多次获取同一个渲染器实例', () => {
      const renderer1 = getRenderer()
      const renderer2 = getRenderer()

      expect(renderer1).toBe(renderer2)
    })
  })

  describe('平台操作接口', () => {
    it('应该能够调用 createElement', () => {
      const renderer = getRenderer()
      const vnode: any = {
        type: 'div',
        props: {},
        isSVGElement: false
      }

      const el = renderer.createElement(vnode)

      expect(el).toBeDefined()
      expect(el.tagName.toLowerCase()).toBe('div')
    })

    it('应该能够调用 createText', () => {
      const renderer = getRenderer()
      const text = renderer.createText('Hello')

      expect(text).toBeDefined()
      expect(text.textContent).toBe('Hello')
    })

    it('应该能够调用 createComment', () => {
      const renderer = getRenderer()
      const comment = renderer.createComment('test comment')

      expect(comment).toBeDefined()
      expect(comment.nodeType).toBe(Node.COMMENT_NODE)
    })

    it('应该能够调用 appendChild', () => {
      const renderer = getRenderer()
      const parent = document.createElement('div')
      const child = document.createElement('span')

      renderer.appendChild(child, parent)

      expect(parent.children).toHaveLength(1)
      expect(parent.children[0]).toBe(child)
    })

    it('应该能够调用 remove', () => {
      const renderer = getRenderer()
      const parent = document.createElement('div')
      const child = document.createElement('span')
      parent.appendChild(child)

      renderer.remove(child)

      expect(parent.children).toHaveLength(0)
    })

    it('应该能够调用 setText', () => {
      const renderer = getRenderer()
      const text = renderer.createText('old')

      renderer.setText(text, 'new')

      expect(text.textContent).toBe('new')
    })

    it('应该能够调用 querySelector', () => {
      const renderer = getRenderer()
      const container = document.createElement('div')
      const child = document.createElement('span')
      child.id = 'test-id'
      container.appendChild(child)
      document.body.appendChild(container)

      const found = renderer.querySelector('#test-id')

      expect(found).toBe(child)

      document.body.removeChild(container)
    })
  })
})
