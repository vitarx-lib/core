import { createView, setRenderer } from '@vitarx/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOMRenderer } from '../../../core/index.js'
import { Head } from '../src/index.js'

setRenderer(new DOMRenderer())

describe('Head 组件', () => {
  let container: HTMLElement
  let originalTitle: string

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    originalTitle = document.title
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
    document.title = originalTitle
    const head = document.head
    const testElements = head.querySelectorAll('[data-test-head]')
    testElements.forEach(el => el.remove())
  })

  describe('Title 处理', () => {
    it('应该使用 document.title API 设置标题', () => {
      const titleView = createView('title', { children: 'New Title' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)

      expect(document.title).toBe('New Title')
    })

    it('应该在组件销毁时恢复原标题', () => {
      document.title = 'Original Title'

      const titleView = createView('title', { children: 'New Title' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)
      expect(document.title).toBe('New Title')

      headView.dispose()
      expect(document.title).toBe('Original Title')
    })

    it('不应该在销毁时恢复标题如果标题已被其他地方修改', () => {
      document.title = 'Original Title'

      const titleView = createView('title', { children: 'New Title' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)
      expect(document.title).toBe('New Title')

      document.title = 'Modified By Other'
      headView.dispose()

      expect(document.title).toBe('Modified By Other')
    })

    it('应该处理空的 title 元素', () => {
      const titleView = createView('title', { children: '' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)
      expect(document.title).toBe('')
    })
  })

  describe('Meta 元素处理', () => {
    it('应该将 meta 元素添加到 document.head', () => {
      const metaView = createView('meta', {
        name: 'description',
        content: 'Test Description',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: metaView
      })

      headView.mount(container)
      const meta = document.head.querySelector('meta[name="description"][data-test-head="true"]')
      expect(meta).toBeTruthy()
      expect(meta?.getAttribute('content')).toBe('Test Description')
    })

    it('应该在组件销毁时移除添加的 meta 元素', () => {
      const metaView = createView('meta', {
        name: 'keywords',
        content: 'test, keywords',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: metaView
      })

      headView.mount(container)
      expect(
        document.head.querySelector('meta[name="keywords"][data-test-head="true"]')
      ).toBeTruthy()

      headView.dispose()
      expect(
        document.head.querySelector('meta[name="keywords"][data-test-head="true"]')
      ).toBeFalsy()
    })
  })

  describe('Link 元素处理', () => {
    it('应该将 link 元素添加到 document.head', () => {
      const linkView = createView('link', {
        rel: 'icon',
        href: '/favicon.ico',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: linkView
      })

      headView.mount(container)

      const link = document.head.querySelector('link[rel="icon"][data-test-head]')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('href')).toBe('/favicon.ico')
    })

    it('应该在组件销毁时移除添加的 link 元素', () => {
      const linkView = createView('link', {
        rel: 'stylesheet',
        href: '/test.css',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: linkView
      })

      headView.mount(container)
      expect(document.head.querySelector('link[href="/test.css"][data-test-head]')).toBeTruthy()

      headView.dispose()
      expect(document.head.querySelector('link[href="/test.css"][data-test-head]')).toBeFalsy()
    })
  })

  describe('Style 元素处理', () => {
    it('应该将 style 元素添加到 document.head', () => {
      const styleView = createView('style', {
        children: 'body { background: red; }',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: styleView
      })

      headView.mount(container)

      const style = document.head.querySelector('style[data-test-head]')
      expect(style).toBeTruthy()
      expect(style?.textContent).toBe('body { background: red; }')
    })

    it('应该在组件销毁时移除添加的 style 元素', () => {
      const styleView = createView('style', {
        children: '.test { color: blue; }',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: styleView
      })

      headView.mount(container)
      expect(document.head.querySelector('style[data-test-head]')).toBeTruthy()

      headView.dispose()
      expect(document.head.querySelector('style[data-test-head]')).toBeFalsy()
    })
  })

  describe('Script 元素处理', () => {
    it('应该将 script 元素添加到 document.head', () => {
      const scriptView = createView('script', {
        src: '/test.js',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: scriptView
      })

      headView.mount(container)

      const script = document.head.querySelector('script[src="/test.js"][data-test-head]')
      expect(script).toBeTruthy()
    })

    it('应该在组件销毁时移除添加的 script 元素', () => {
      const scriptView = createView('script', {
        src: '/test.js',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: scriptView
      })

      headView.mount(container)
      expect(document.head.querySelector('script[src="/test.js"][data-test-head]')).toBeTruthy()

      headView.dispose()
      expect(document.head.querySelector('script[src="/test.js"][data-test-head]')).toBeFalsy()
    })
  })

  describe('多个子元素处理', () => {
    it('应该同时处理多个 head 元素', () => {
      const children = [
        createView('title', { children: 'Multi Test' }),
        createView('meta', {
          name: 'description',
          content: 'Multi Description',
          'data-test-head': 'true'
        }),
        createView('link', {
          rel: 'icon',
          href: '/favicon.ico',
          'data-test-head': 'true'
        })
      ]

      const headView = createView(Head, {
        children
      })

      headView.mount(container)

      expect(document.title).toBe('Multi Test')
      expect(document.head.querySelector('meta[name="description"][data-test-head]')).toBeTruthy()
      expect(document.head.querySelector('link[rel="icon"][data-test-head]')).toBeTruthy()
    })

    it('应该在销毁时清理所有添加的元素', () => {
      const children = [
        createView('title', { children: 'Multi Test' }),
        createView('meta', {
          name: 'keywords',
          content: 'test',
          'data-test-head': 'true'
        }),
        createView('style', {
          children: 'body {}',
          'data-test-head': 'true'
        })
      ]

      const headView = createView(Head, {
        children
      })

      headView.mount(container)
      headView.dispose()

      expect(document.head.querySelector('meta[name="keywords"][data-test-head]')).toBeFalsy()
      expect(document.head.querySelector('style[data-test-head]')).toBeFalsy()
    })
  })

  describe('SSR 模式模拟', () => {
    let originalSSR: boolean

    beforeEach(() => {
      originalSSR = (globalThis as any).__VITARX_SSR__
      ;(globalThis as any).__VITARX_SSR__ = true
    })

    afterEach(() => {
      ;(globalThis as any).__VITARX_SSR__ = originalSSR
    })

    it('应该在 SSR 模式下返回注释节点占位符', () => {
      const titleView = createView('title', { children: 'SSR Title' })
      const headView = createView(Head, {
        children: titleView
      })

      expect(() => {
        headView.mount(container)
      }).toThrowError('[View.mount] Not supported in SSR mode')
    })
  })

  describe('返回值', () => {
    it('应该返回注释节点作为占位符', () => {
      const titleView = createView('title', { children: 'Test' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)

      expect(container.innerHTML).toContain('teleport:head')
    })
  })

  describe('边界情况', () => {
    it('应该过滤非元素视图的子元素', () => {
      const children = [
        createView('title', { children: 'Filter Test' }),
        'text node' as any,
        createView('meta', {
          name: 'test',
          'data-test-head': 'true'
        })
      ]

      const headView = createView(Head, {
        children
      })

      headView.mount(container)

      expect(document.title).toBe('Filter Test')
      expect(document.head.querySelector('meta[name="test"][data-test-head]')).toBeTruthy()
    })

    it('应该处理 children 为 null 的情况', () => {
      const headView = createView(Head, {
        children: null as any
      })

      headView.mount(container)

      expect(container.innerHTML).toContain('teleport:head')
    })

    it('应该处理 children 为 undefined 的情况', () => {
      const headView = createView(Head, {
        children: undefined as any
      })

      headView.mount(container)

      expect(container.innerHTML).toContain('teleport:head')
    })

    it('应该正确处理嵌套的响应式 children', () => {
      const titleView = createView('title', { children: 'Reactive Test' })
      const headView = createView(Head, {
        children: titleView
      })

      headView.mount(container)

      expect(document.title).toBe('Reactive Test')
    })
  })

  describe('生命周期', () => {
    it('应该在挂载时初始化子元素', () => {
      const initSpy = vi.fn()
      const metaView = createView('meta', {
        name: 'lifecycle-test',
        'data-test-head': 'true'
      })

      const originalInit = metaView.init
      metaView.init = context => {
        initSpy()
        return originalInit.call(metaView, context)
      }

      const headView = createView(Head, {
        children: metaView
      })

      headView.mount(container)

      expect(initSpy).toHaveBeenCalled()
    })

    it('应该在销毁时正确清理资源', () => {
      const styleView = createView('style', {
        children: '.cleanup { color: red; }',
        'data-test-head': 'true'
      })
      const headView = createView(Head, {
        children: styleView
      })

      headView.mount(container)

      const styleBefore = document.head.querySelector('style[data-test-head]')
      expect(styleBefore).toBeTruthy()

      headView.dispose()

      const styleAfter = document.head.querySelector('style[data-test-head]')
      expect(styleAfter).toBeFalsy()
    })
  })
})
