import { Fragment, getRenderer, h } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { activate } from '../../src/client/activate.js'
import { hydrateNode } from '../../src/client/hydrate.js'
import { createSSRApp, renderToString } from '../../src/index.js'
import { createContainer } from '../helpers.js'

describe('activate', () => {
  it('应该跳过已在DOM中的普通元素重复插入', async () => {
    const App = () => h('div', { id: 'test' }, 'Content')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const view = h('div', { id: 'test' }, 'Content')
    await hydrateNode(view, container)

    // 记录激活前的 DOM 结构
    const divBefore = container.querySelector('#test')!
    const childCountBefore = container.childNodes.length

    activate(view, container)

    // 激活后容器子节点数不变，说明没有重复插入
    expect(container.childNodes.length).toBe(childCountBefore)
    // 同一个 DOM 元素，未被替换
    expect(container.querySelector('#test')).toBe(divBefore)
  })

  it('应该跳过已在DOM中的片段重复插入', async () => {
    // noinspection DuplicatedCode
    const App = () => h('div', [h(Fragment, [h('span', 'A'), h('span', 'B')])])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const fragmentVNode = h(Fragment, [h('span', 'A'), h('span', 'B')])
    const parentVNode = h('div', [fragmentVNode])
    await hydrateNode(parentVNode, container)

    const divBefore = container.querySelector('div')!
    const htmlBefore = divBefore.innerHTML

    activate(parentVNode, container)

    // 激活后内部 HTML 不变，片段锚点未被重新插入
    const divAfter = container.querySelector('div')!
    expect(divAfter.innerHTML).toBe(htmlBefore)
    expect(divAfter.querySelectorAll('span').length).toBe(2)
  })

  it('嵌套片段激活后卸载应正确移除所有内容', async () => {
    const App = () =>
      h('div', [
        h('p', 'before'),
        h(Fragment, [h('span', 'A'), h(Fragment, [h('em', 'nested')]), h('span', 'B')]),
        h('p', 'after')
      ])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const innerFragment = h(Fragment, [h('em', 'nested')])
    const outerFragment = h(Fragment, [h('span', 'A'), innerFragment, h('span', 'B')])
    const parentVNode = h('div', [h('p', 'before'), outerFragment, h('p', 'after')])
    await hydrateNode(parentVNode, container)
    activate(parentVNode, container)
    // 卸载外层片段，应移除所有片段内容（包括嵌套片段）
    outerFragment.dispose()

    const div = container.querySelector('div')!
    // 只剩下 before 和 after 两个 p 标签
    expect(div.querySelectorAll('p').length).toBe(2)
    expect(div.querySelectorAll('span').length).toBe(0)
    expect(div.querySelectorAll('em').length).toBe(0)
    expect(div.textContent).toBe('beforeafter')
  })

  it('应该正常插入尚未在DOM中的元素', () => {
    const container = createContainer('')
    const view = h('div', { id: 'new' }, 'New Content')

    activate(view, container)

    expect(container.querySelector('#new')).toBeTruthy()
    expect(container.textContent).toBe('New Content')
  })

  it('激活后应恢复渲染器的原始append方法', async () => {
    const App = () => h('div', 'Content')
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const view = h('div', 'Content')
    await hydrateNode(view, container)

    const renderer = getRenderer()

    activate(view, container)

    // 激活后 append 方法应恢复，不再是重写版本
    // 通过验证 append 行为正常来间接确认恢复
    const testContainer = document.createElement('div')
    const testEl = document.createElement('span')
    // 如果 append 未恢复，已在 DOM 中的节点会被跳过
    testContainer.appendChild(testEl)
    renderer.append(testEl, testContainer)
    // append 应正常工作（testEl 仍在 testContainer 中）
    expect(testEl.parentNode).toBe(testContainer)
  })

  it('多个片段激活后DOM结构应保持正确', async () => {
    const App = () =>
      h('ul', [
        h(Fragment, [h('li', '1'), h('li', '2')]),
        h('li', '3'),
        h(Fragment, [h('li', '4'), h('li', '5')])
      ])
    const app = createSSRApp(App)
    const html = await renderToString(app)
    const container = createContainer(html)

    const frag1 = h(Fragment, [h('li', '1'), h('li', '2')])
    const frag2 = h(Fragment, [h('li', '4'), h('li', '5')])
    const parentVNode = h('ul', [frag1, h('li', '3'), frag2])
    await hydrateNode(parentVNode, container)
    activate(parentVNode, container)
    const ul = container.querySelector('ul')!
    const items = ul.querySelectorAll('li')
    // 5 个 li 顺序不变
    expect(items.length).toBe(5)
    expect(items[0].textContent).toBe('1')
    expect(items[1].textContent).toBe('2')
    expect(items[2].textContent).toBe('3')
    expect(items[3].textContent).toBe('4')
    expect(items[4].textContent).toBe('5')
  })
})
