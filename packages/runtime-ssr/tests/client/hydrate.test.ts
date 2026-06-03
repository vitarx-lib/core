import { flushSync, ref } from '@vitarx/responsive'
import {
  createCommentView,
  createDynamicView,
  createView,
  Fragment,
  h,
  onInit,
  ViewState
} from '@vitarx/runtime-core'
import { sleep } from '@vitarx/utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { hydrateNode } from '../../src/client/hydrate.js'
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
})

describe('hydrateNode', () => {
  it('应该匹配并激活常规元素', async () => {
    const App = () => createView('div', { id: 'test', children: 'Content' })
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)
    const view = createView('div', { id: 'test', children: 'Content' })
    view.init()
    await hydrateNode(view, container)
    expect(view.node).toBeTruthy()
    expect(view.state).toBe(ViewState.INITIALIZED)
    expect((view.node as HTMLElement).id).toBe('test')
  })

  it('应该激活嵌套子元素', async () => {
    const App = () =>
      createView('div', {
        children: [
          createView('span', { children: 'Child 1' }),
          createView('span', { children: 'Child 2' })
        ]
      })
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const view = createView('div', {
      children: [
        createView('span', { children: 'Child 1' }),
        createView('span', { children: 'Child 2' })
      ]
    })

    await hydrateNode(view, container)

    expect(view.node).toBeTruthy()
    const spans = view.node.querySelectorAll('span')
    expect(spans.length).toBe(2)
    expect(spans[0].textContent).toBe('Child 1')
    expect(spans[1].textContent).toBe('Child 2')
  })

  it('应该处理空元素', async () => {
    const App = () => createView('img', { src: 'test.jpg', alt: 'Test' })
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const view = createView('img', { src: 'test.jpg', alt: 'Test' })

    await hydrateNode(view, container)

    expect(view.node).toBeTruthy()
    expect((view.node as HTMLImageElement).src).toContain('test.jpg')
  })

  it('应该处理文本节点', async () => {
    const div = createView('div', { children: 'Plain text' })
    const html = await renderToString(div)
    const container = createContainer(html)

    await hydrateNode(div, container)

    expect(div.node.textContent).toBe('Plain text')
  })

  it('应该处理片段节点', async () => {
    // noinspection DuplicatedCode
    const App = () => h('div', [h(Fragment, [h('span', 'A'), h('span', 'B')])])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const fragmentVNode = h(Fragment, [h('span', 'A'), h('span', 'B')])

    const parentVNode = h('div', [fragmentVNode])

    await hydrateNode(parentVNode, container)

    const div = container.querySelector('div')!
    console.log(div.innerHTML)
    expect(div.querySelectorAll('span').length).toBe(2)
  })

  it('应该等待异步组件', async () => {
    const App = () => {
      const text = ref('async')
      onInit(async () => {
        await sleep(20)
        text.value = 'done'
      })
      return createDynamicView(text)
    }

    const serverApp = createSSRApp(App)
    const html = await renderToString(serverApp)
    const container = createContainer(html)
    const clientApp = createSSRApp(App)
    const view = clientApp.rootView
    view.init()
    await hydrateNode(view, container)
    expect(view.node).toBeTruthy()
    expect(view.state).toBe(ViewState.INITIALIZED)
    expect(container.textContent).toBe('done')
  })

  it('当找不到DOM时应该回退到正常渲染', async () => {
    const container = createContainer('')

    const view = h('div', { id: 'new' }, 'New Content')

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await hydrateNode(view, container)

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('cannot find DOM node for <div>')
    )
    expect(view.node).toBeTruthy()
    view.mount(container)
    expect(container.querySelector('#new')).toBeTruthy()

    consoleWarn.mockRestore()
  })

  it('当标签不匹配时应该回退', async () => {
    const App = () => h('div', null, 'Old')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    // 尝试用 span 替代 div
    const view = h('span', 'New')

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await hydrateNode(view, container)

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('[Hydration] element mismatch')
    )
    expect(view.node).toBeTruthy()
    expect(container.querySelector('span')).toBeTruthy()
    expect(container.querySelector('div')).toBeFalsy()

    consoleWarn.mockRestore()
  })

  it('激活期间应该更新属性', async () => {
    const App = () => h('div', { class: 'old' }, 'Content')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    // 客户端有不同的 class
    const view = h('div', { class: 'new' }, 'Content')

    await hydrateNode(view, container)
    view.mount(container)
    expect((view.node as HTMLElement).className).toBe('new')
  })

  it('应该返回正确的下一个索引', async () => {
    const App = () => h('div', [h('span', 'A'), h('span', 'B')])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)
    const vnode = h('div', [h('span', 'A'), h('span', 'B')])

    const nextIndex = await hydrateNode(vnode, container)

    expect(nextIndex).toBe(1) // 应该返回下一个索引
    expect(container.innerHTML).toBe('<div><span>A</span><span>B</span></div>')
    expect(vnode.node).toBeTruthy()
    expect(vnode.node).toBe(container.querySelector('div'))
  })

  it('应该清理常规元素中的额外DOM节点', async () => {
    // 服务端渲染了3个子节点
    const container = createContainer(`
      <div>
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>
    `)
    // 客户端只有2个子节点
    const vnode = h('div', [h('span', '1'), h('span', '2')])

    await hydrateNode(vnode, container)

    const div = container.querySelector('div')!
    expect(div.querySelectorAll('span').length).toBe(2) // 多余的第3个应被删除
  })

  it('应该清理片段中的额外DOM', async () => {
    // 服务端渲染的 Fragment 有3个子节点
    const container = createContainer(
      '<div><!--Fragment:start--><span>1</span><span>2</span><span>3</span><!--Fragment:end--></div>'
    )

    // 客户端只有2个子节点
    const fragmentVNode = h(Fragment, [h('span', '1'), h('span', '2')])
    const parentVNode = h('div', [fragmentVNode])

    await hydrateNode(parentVNode, container)

    const div = container.querySelector('div')!
    const spans = div.querySelectorAll('span')
    expect(spans.length).toBe(2) // 多余的第3个span应被删除
  })

  it('应该正确处理组件节点', async () => {
    const Widget = () => h('div', null, 'Widget Content')
    const App = () => h(Widget)

    const serverApp = createSSRApp(App)
    const html = await renderToString(serverApp)
    const container = createContainer(html)

    const clientApp = createSSRApp(App)

    const view = clientApp.rootView

    view.init()

    await hydrateNode(view, container)

    expect(view.state).toBe(ViewState.INITIALIZED)
    expect(container.textContent).toContain('Widget Content')
  })

  it('应该处理注释节点', async () => {
    const container = createContainer('<div><!--comment text--></div>')
    const commentView = createCommentView('comment text')
    const parentView = h('div', commentView)
    await hydrateNode(parentView, container)

    expect(commentView.node).toBeTruthy()
    expect(commentView.node.parentNode).toBe(parentView.node)
  })
})
