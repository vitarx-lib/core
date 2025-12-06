import { Fragment, h, resolveDirective, withDirectives } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { createSSRApp } from '../../src/app/index.js'
import { renderToString } from '../../src/server/renderToString.js'
import {
  createMockAsyncComponent,
  createMockClassComponent,
  createMockComponent,
  createMockSSRContext
} from '../helpers.js'

describe('renderToString', () => {
  it('应该渲染基本元素', async () => {
    const App = () => h('div', { id: 'app' }, 'Hello World')
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('<div')
    expect(html).toContain('id="app"')
    expect(html).toContain('Hello World')
    expect(html).toContain('</div>')
  })

  it('应该渲染嵌套元素', async () => {
    const App = () =>
      h(
        'div',
        null,
        h('header', null, h('h1', null, 'Title')),
        h('main', null, h('p', null, 'Content'))
      )
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('<header>')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<main>')
    expect(html).toContain('<p>Content</p>')
  })

  it('应该渲染空元素', async () => {
    const App = () =>
      h('div', null, h('img', { src: 'test.jpg', alt: 'Test' }), h('input', { type: 'text' }))
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('<img')
    expect(html).toContain('src="test.jpg"')
    expect(html).toContain('/>')
    expect(html).toContain('<input')
    expect(html).toContain('type="text"')
  })

  it('应该处理类名和样式', async () => {
    const App = () =>
      h(
        'div',
        {
          class: 'foo bar',
          style: { color: 'red', fontSize: '14px' }
        },
        'Styled'
      )
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('class="foo bar"')
    expect(html).toContain('style=')
    expect(html).toContain('color')
    expect(html).toContain('red')
  })

  it('应该过滤掉事件处理器', async () => {
    const App = () =>
      h(
        'button',
        {
          onClick: () => console.log('clicked'),
          id: 'btn'
        },
        'Click me'
      )
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).not.toContain('onClick')
    expect(html).toContain('id="btn"')
  })

  it('应该转义HTML特殊字符', async () => {
    const App = () => h('div', null, '<script>alert("xss")</script>')
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('应该渲染片段', async () => {
    const App = () => h(Fragment, null, h('div', null, 'First'), h('div', null, 'Second'))
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('<!--Fragment start-->')
    expect(html).toContain('<div>First</div>')
    expect(html).toContain('<div>Second</div>')
    expect(html).toContain('<!--Fragment end-->')
  })

  it('应该渲染函数组件', async () => {
    const TestComponent = createMockComponent('Test Content')
    const App = () => h(TestComponent)
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('Test Content')
  })

  it('应该渲染类组件', async () => {
    const TestWidget = createMockClassComponent('Widget Content')
    const App = () => h(TestWidget)
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('Widget Content')
  })

  it('应该处理v-show指令', async () => {
    const App = () => {
      const vnode = h('div', null, 'Content')
      withDirectives(vnode, [resolveDirective('show')!])
      return vnode
    }
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('style=')
    expect(html).toContain('display')
    expect(html).toContain('none')
  })

  it('应该处理v-html指令', async () => {
    const App = () => h('div', { 'v-html': '<span>Raw HTML</span>' })
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('<span>Raw HTML</span>')
  })

  it('应该等待异步组件', async () => {
    const AsyncComponent = createMockAsyncComponent('Async Content', 20)
    const App = () => h('div', null, h(AsyncComponent))
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('Async Content')
  })

  it('应该使用SSR上下文', async () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)
    const context = createMockSSRContext()

    const html = await renderToString(app, context)

    expect(html).toContain('Content')
    expect(context.$nodeAsyncMap).toBeUndefined() // 应该被清理
  })

  it('应该处理复杂的嵌套结构', async () => {
    const Header = () => h('header', null, h('h1', null, 'Header'))
    const Content = () => h('main', null, h('p', null, 'Main content'))
    const Footer = () => h('footer', null, h('p', null, 'Footer'))

    const App = () => h('div', { class: 'app' }, h(Header), h(Content), h(Footer))
    const app = createSSRApp(App)

    const html = await renderToString(app)

    expect(html).toContain('class="app"')
    expect(html).toContain('<header>')
    expect(html).toContain('<h1>Header</h1>')
    expect(html).toContain('<main>')
    expect(html).toContain('<p>Main content</p>')
    expect(html).toContain('<footer>')
  })
})
