import { flushSync, ref } from '@vitarx/responsive'
import { Fragment, h } from '@vitarx/runtime-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { createSSRApp, hydrate, renderToString } from '../../src/index.js'
import { createContainer, createMockAsyncComponent } from '../helpers.js'

describe('hydrate', () => {
  beforeEach(() => {
    // 清理全局状态
    delete (window as any).__INITIAL_STATE__
  })

  it('当找不到容器时应该抛出错误', async () => {
    const App = () => h('div', null, 'Test')
    const app = createSSRApp(App)

    expect(() => hydrate(app, '#nonexistent')).toThrow()
  })

  it('应该激活基本元素', async () => {
    const App = () => h('div', { id: 'content' }, 'Hello Hydrate')
    const app = createSSRApp(App)

    // 服务端渲染
    const html = await renderToString(app)
    const container = createContainer(html)

    // 客户端水合
    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    expect(container.querySelector('#content')).toBeTruthy()
    expect(container.querySelector('#content')?.textContent).toBe('Hello Hydrate')
  })

  it('应该使用字符串选择器激活', async () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, '#app')

    expect(document.querySelector('#app div')).toBeTruthy()
  })

  it('应该从window.__INITIAL_STATE__恢复状态', async () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    // 模拟服务端注入的状态
    ;(window as any).__INITIAL_STATE__ = {
      user: { id: 1, name: 'John' },
      theme: 'dark'
    }

    const context: any = {}
    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container, context)

    // 验证状态已合并
    expect(context.user).toEqual({ id: 1, name: 'John' })
    expect(context.theme).toBe('dark')
  })

  it('应该激活嵌套元素', async () => {
    const App = () =>
      h('div', { id: 'root' }, [
        h('header', null, h('h1', null, 'Title')),
        h('main', null, h('p', null, 'Content'))
      ])
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    expect(container.querySelector('header h1')?.textContent).toBe('Title')
    expect(container.querySelector('main p')?.textContent).toBe('Content')
  })

  it('激活后应该绑定事件处理器', async () => {
    let clicked = false
    const App = () => h('button', { onClick: () => (clicked = true) }, 'Click me')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    // 触发点击事件
    const button = container.querySelector('button')!
    button.click()

    expect(clicked).toBe(true)
  })

  it('激活期间应该处理异步组件', async () => {
    const AsyncComponent = createMockAsyncComponent('Async Content', 20)
    const App = () => h('div', null, h(AsyncComponent))
    const serverApp = createSSRApp(App)
    const html = await renderToString(serverApp)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    expect(container.textContent).toContain('Async Content')
  })

  it('应该激活片段节点', async () => {
    const App = () =>
      h('div', null, [h(Fragment, null, [h('span', null, 'First'), h('span', null, 'Second')])])
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    const spans = container.querySelectorAll('span')
    expect(spans.length).toBe(2)
    expect(spans[0].textContent).toBe('First')
    expect(spans[1].textContent).toBe('Second')
  })

  it('激活后应该处理响应式状态', async () => {
    const App = () => {
      const count = ref(0)
      return h('div', null, [
        h('span', { id: 'count' }, count),
        h('button', { onClick: () => count.value++ }, 'Increment')
      ])
    }
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    // 初始值
    expect(container.querySelector('#count')?.textContent).toBe('0')

    // 点击按钮
    const button = container.querySelector('button')!
    button.click()

    // 同步更新
    flushSync()

    // 验证响应式更新
    expect(container.querySelector('#count')?.textContent).toBe('1')
  })

  it('完成后应该清理激活标志', async () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const context: any = {}
    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container, context)

    // 验证内部标识已清理
    expect(context.$isHydrating).toBeFalsy()
  })

  it('即使出错也应该清理标志', async () => {
    const ErrorComponent = () => {
      throw new Error('Component error')
    }
    const App = () => h(ErrorComponent)

    const container = createContainer('<!--comment text-->')
    const context: any = {}
    const app = createSSRApp(App)
    const errorHandler = vi.fn()
    app.config.errorHandler = errorHandler
    await hydrate(app, container, context)

    // 即使出错也应清理标识
    expect(context.$isHydrating).toBeFalsy()
    expect(errorHandler).toHaveBeenCalledOnce()
    expect(container.outerHTML).toContain('<!--')
  })

  it('应该激活空元素', async () => {
    const App = () =>
      h('div', null, [
        h('img', { src: 'test.jpg', alt: 'Test' }),
        h('input', { type: 'text', value: 'test' }),
        h('br')
      ])
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    expect(container.querySelector('img')).toBeTruthy()
    expect(container.querySelector('input')).toBeTruthy()
    expect(container.querySelector('br')).toBeTruthy()
  })

  it('应该正确处理文本节点', async () => {
    const App = () => h('div', null, 'Plain text content')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container)

    expect(container.textContent).toBe('Plain text content')
  })

  it('应该合并多个上下文', async () => {
    const App = () => h('div', null, 'Content')
    const app = createSSRApp(App)

    const html = await renderToString(app)
    const container = createContainer(html)

    ;(window as any).__INITIAL_STATE__ = { a: 1 }
    const context = { b: 2 }

    const clientApp = createSSRApp(App)
    await hydrate(clientApp, container, context)

    expect((context as any).a).toBe(1)
    expect((context as any).b).toBe(2)
  })
})
