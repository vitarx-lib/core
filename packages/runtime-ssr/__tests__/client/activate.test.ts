import {
  createCommentVNode,
  Fragment,
  h,
  NodeState,
  renderNode,
  setDefaultDriver
} from '@vitarx/runtime-core'
import { describe, expect, it, vi } from 'vitest'
import { hydrateNode } from '../../src/client/activate.js'
import { createSSRApp, renderToString } from '../../src/index.js'
import { SSRRenderDriver } from '../../src/server/SSRRenderDriver.js'
import { createContainer, createMockAsyncComponent } from '../helpers.js'

describe('hydrateNode', () => {
  it('应该匹配并激活常规元素', async () => {
    const App = () => h('div', { id: 'test' }, 'Content')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const vnode = h('div', { id: 'test' }, 'Content')
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(vnode.el).toBeTruthy()
    expect(vnode.state).toBe(NodeState.Rendered)
    expect((vnode.el as HTMLElement).id).toBe('test')
  })

  it('应该激活嵌套子元素', async () => {
    const App = () => h('div', null, [h('span', null, 'Child 1'), h('span', null, 'Child 2')])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const vnode = h('div', {}, [h('span', {}, 'Child 1'), h('span', {}, 'Child 2')])
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(vnode.el).toBeTruthy()
    const spans = (vnode.el as HTMLElement).querySelectorAll('span')
    expect(spans.length).toBe(2)
    expect(spans[0].textContent).toBe('Child 1')
    expect(spans[1].textContent).toBe('Child 2')
  })

  it('应该处理空元素', async () => {
    const App = () => h('img', { src: 'test.jpg', alt: 'Test' })
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const vnode = h('img', { src: 'test.jpg', alt: 'Test' })
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(vnode.el).toBeTruthy()
    expect(vnode.state).toBe(NodeState.Rendered)
    expect((vnode.el as HTMLImageElement).src).toContain('test.jpg')
  })

  it('应该处理文本节点', async () => {
    const App = () => h('div', null, 'Plain text')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const vnode = h('div', {}, 'Plain text')
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect((vnode.el as HTMLElement).textContent).toBe('Plain text')
  })

  it('应该处理片段节点', async () => {
    const App = () =>
      h('div', null, [h(Fragment, null, [h('span', null, 'A'), h('span', null, 'B')])])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const fragmentVNode = h(Fragment, {}, [h('span', {}, 'A'), h('span', {}, 'B')])
    const parentVNode = h('div', {}, [fragmentVNode])
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(parentVNode, container, nodeAsyncMap, 0)

    const div = container.querySelector('div')!
    expect(div.querySelectorAll('span').length).toBe(2)
  })

  it('应该等待异步组件', async () => {
    const AsyncComp = createMockAsyncComponent('Async', 30)
    const App = () => h(AsyncComp)

    const serverApp = createSSRApp(App)
    const html = await renderToString(serverApp)
    const container = createContainer(html)
    const clientApp = createSSRApp(App)
    const vnode = clientApp.rootNode
    renderNode(clientApp.rootNode)
    const nodeAsyncMap = new WeakMap()
    await hydrateNode(vnode, container, nodeAsyncMap, 0)
    expect(vnode.el).toBeTruthy()
    expect(vnode.state).toBe(NodeState.Rendered)
    expect(container.textContent).toBe('Async')
  })

  it('当找不到DOM时应该回退到正常渲染', async () => {
    const container = createContainer('') // 空容器

    const vnode = h('div', { id: 'new' }, 'New Content')
    const nodeAsyncMap = new WeakMap()

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('[Hydration] Cannot find element')
    )
    expect(vnode.el).toBeTruthy()
    expect(container.querySelector('#new')).toBeTruthy()

    consoleWarn.mockRestore()
  })

  it('当标签不匹配时应该回退', async () => {
    const App = () => h('div', null, 'Old')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    // 尝试用 span 替代 div
    const vnode = h('span', {}, 'New')
    const nodeAsyncMap = new WeakMap()

    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('[Hydration] Element mismatch')
    )
    expect(vnode.el).toBeTruthy()
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
    const vnode = h('div', { class: 'new' }, 'Content')
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect((vnode.el as HTMLElement).className).toBe('new')
  })

  it('应该返回正确的下一个索引', async () => {
    const App = () => h('div', null, [h('span', null, 'A'), h('span', null, 'B')])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)
    const vnode = h('div', {}, [h('span', {}, 'A'), h('span', {}, 'B')])
    const nodeAsyncMap = new WeakMap()

    const nextIndex = await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(nextIndex).toBe(1) // 应该返回下一个索引
    expect(container.innerHTML).toBe('<div><span>A</span><span>B</span></div>')
    expect(vnode.el).toBeTruthy()
    expect(vnode.state).toBe(NodeState.Rendered)
    expect(vnode.el).toBe(container.querySelector('div'))
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
    const vnode = h('div', {}, [h('span', {}, '1'), h('span', {}, '2')])
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    const div = container.querySelector('div')!
    expect(div.querySelectorAll('span').length).toBe(2) // 多余的第3个应被删除
  })

  it('应该清理片段中的额外DOM', async () => {
    // 服务端渲染的 Fragment 有3个子节点
    const container = createContainer(
      '<div><!--Fragment start--><span>1</span><span>2</span><span>3</span><!--Fragment end--></div>'
    )

    // 客户端只有2个子节点
    const fragmentVNode = h('fragment', {}, [h('span', {}, '1'), h('span', {}, '2')])
    const parentVNode = h('div', {}, [fragmentVNode])
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(parentVNode, container, nodeAsyncMap, 0)

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

    const vnode = clientApp.rootNode
    // 4. 注册水合驱动
    setDefaultDriver(new SSRRenderDriver())

    // 5. 预渲染 - 触发 onRender，收集异步任务到 WeakMap
    renderNode(clientApp.rootNode)
    const nodeAsyncMap = new WeakMap()

    await hydrateNode(vnode, container, nodeAsyncMap, 0)

    expect(vnode.state).toBe(NodeState.Rendered)
    expect(container.textContent).toContain('Widget Content')
  })

  it('应该处理注释节点', async () => {
    const container = createContainer('<div><!--comment text--></div>')

    const commentVNode = createCommentVNode({ text: 'comment text' })
    const parentVNode = h('div', {}, [commentVNode])
    const nodeAsyncMap = new WeakMap()

    // 先渲染父节点和子节点
    const tempContainer = document.createElement('div')
    const parentEl = document.createElement('div')
    const commentEl = document.createComment('comment text')
    parentEl.appendChild(commentEl)
    tempContainer.appendChild(parentEl)

    parentVNode.el = parentEl
    commentVNode.el = commentEl
    commentVNode.state = NodeState.Rendered

    await hydrateNode(parentVNode, container, nodeAsyncMap, 0)

    expect(commentVNode.state).toBe(NodeState.Rendered)
    expect(commentVNode.el).toBeTruthy()
  })
})
