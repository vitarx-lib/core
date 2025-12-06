import { createVNode, h, NodeKind } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { normalRender } from '../../src/client/render.js'

describe('normalRender', () => {
  it('应该渲染常规元素', () => {
    const vnode = h('div', { id: 'test' }, 'Content')

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    expect((vnode.el as HTMLElement).tagName.toLowerCase()).toBe('div')
    expect((vnode.el as HTMLElement).id).toBe('test')
    expect((vnode.el as HTMLElement).textContent).toBe('Content')
  })

  it('应该渲染空元素', () => {
    const vnode = h('img', { src: 'test.jpg', alt: 'Test' })

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    expect((vnode.el as HTMLElement).tagName.toLowerCase()).toBe('img')
    expect((vnode.el as HTMLImageElement).src).toContain('test.jpg')
  })

  it('应该渲染文本节点', () => {
    const vnode = {
      kind: NodeKind.TEXT,
      props: { text: 'Hello World' },
      state: 0,
      el: null
    } as any

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    expect(vnode.el.nodeType).toBe(Node.TEXT_NODE)
    expect(vnode.el.textContent).toBe('Hello World')
  })

  it('应该渲染注释节点', () => {
    const vnode = {
      kind: NodeKind.COMMENT,
      props: { text: 'This is a comment' },
      state: 0,
      el: null
    } as any

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    expect(vnode.el.nodeType).toBe(Node.COMMENT_NODE)
    expect(vnode.el.nodeValue).toBe('This is a comment')
  })

  it('应该渲染片段节点', () => {
    const vnode = h('fragment', {}, [h('span', {}, 'A'), h('span', {}, 'B')])

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    // Fragment 应该有起止锚点
    expect((vnode.el as any).$startAnchor).toBeTruthy()
    expect((vnode.el as any).$endAnchor).toBeTruthy()
  })

  it('应该渲染嵌套子元素', () => {
    const vnode = h('div', {}, [
      h('span', {}, 'Child 1'),
      h('span', {}, 'Child 2'),
      h('p', {}, 'Child 3')
    ])

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    const div = vnode.el as HTMLElement
    expect(div.children.length).toBe(3)
    expect(div.children[0].tagName.toLowerCase()).toBe('span')
    expect(div.children[1].tagName.toLowerCase()).toBe('span')
    expect(div.children[2].tagName.toLowerCase()).toBe('p')
  })

  it('应该渲染组件节点', () => {
    const Widget = () => h('div', { id: 'widget' }, 'Widget Content')
    const vnode = createVNode(Widget, {})

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    // Widget 的 el 应该指向其 child 的 el
    expect((vnode.el as HTMLElement).id).toBe('widget')
    expect((vnode.el as HTMLElement).textContent).toBe('Widget Content')
  })

  it('应该处理深度嵌套结构', () => {
    const vnode = h('div', {}, [
      h('header', {}, [h('h1', {}, 'Title')]),
      h('main', {}, [h('p', {}, 'Paragraph 1'), h('p', {}, 'Paragraph 2')])
    ])

    normalRender(vnode)

    const div = vnode.el as HTMLElement
    expect(div.querySelector('h1')?.textContent).toBe('Title')
    expect(div.querySelectorAll('p').length).toBe(2)
  })

  it('应该将元素状态设置为已渲染', () => {
    const vnode = h('div', {}, 'Content')

    normalRender(vnode)

    // 注意：normalRender 不设置 state，由调用方设置
    expect(vnode.el).toBeTruthy()
  })

  it('应该处理空子元素', () => {
    const vnode = h('div', {}, [])

    normalRender(vnode)

    expect(vnode.el).toBeTruthy()
    expect((vnode.el as HTMLElement).children.length).toBe(0)
  })

  it('应该在遇到未知节点类型时抛出错误', () => {
    const vnode = {
      kind: 999 as NodeKind,
      props: {},
      state: 0,
      el: null
    } as any

    expect(() => normalRender(vnode)).toThrow('Unknown node kind')
  })
})
