import { ref } from '@vitarx/responsive'
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
import { describe, expect, it, vi } from 'vitest'
import { hydrateNode } from '../../src/client/activate.js'
import { createSSRApp, renderToString } from '../../src/index.js'
import { createContainer } from '../helpers.js'

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
    const App = () => h('div', [h(Fragment, [h('span', 'A'), h('span', 'B')])])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const fragmentVNode = h(Fragment, [h('span', 'A'), h('span', 'B')])
    const parentVNode = h('div', [fragmentVNode])

    await hydrateNode(parentVNode, container)

    const div = container.querySelector('div')!
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
    const container = createContainer('') // 空容器

    const view = h('div', { id: 'new' }, 'New Content')

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await hydrateNode(view, container)

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot find dom node for <div>')
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
