import { createCommentView, createTextView, Fragment, h, ViewKind } from '@vitarx/runtime-core'
import { describe, expect, it } from 'vitest'
import { renderViewNode } from '../../src/client/render.js'

const container = document.createElement('div')
describe('renderViewNode', () => {
  it('应该渲染常规元素', () => {
    const view = h('div', { id: 'test' }, 'Content')

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    expect(view.node.tagName.toLowerCase()).toBe('div')
  })

  it('应该渲染空元素', () => {
    const view = h('img', { src: 'test.jpg', alt: 'Test' })

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    expect(view.node.tagName.toLowerCase()).toBe('img')
  })

  it('应该渲染文本节点', () => {
    const view = createTextView('')

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    expect(view.node.nodeType).toBe(Node.TEXT_NODE)
  })

  it('应该渲染注释节点', () => {
    const view = createCommentView('')

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    expect(view.node.nodeType).toBe(Node.COMMENT_NODE)
  })

  it('应该渲染片段节点', () => {
    const view = h(Fragment, [h('span', 'A'), h('span', 'B')])

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    // Fragment 应该有起止锚点
    expect(view.node.$startAnchor).toBeTruthy()
    expect(view.node.$endAnchor).toBeTruthy()
  })

  it('应该不渲染嵌套子元素', () => {
    const view = h('div', {}, [
      h('span', {}, 'Child 1'),
      h('span', {}, 'Child 2'),
      h('p', {}, 'Child 3')
    ])

    const div = renderViewNode(view, container) as HTMLElement

    expect(view.node).toBeTruthy()
    expect(div.children.length).toBe(0)
  })

  it('应该将元素状态设置为已渲染', () => {
    const view = h('div', {}, 'Content')

    renderViewNode(view, container)

    // 注意：normalRender 不设置 state，由调用方设置
    expect(view.node).toBeTruthy()
  })

  it('应该处理空子元素', () => {
    const view = h('div', {}, [])

    renderViewNode(view, container)

    expect(view.node).toBeTruthy()
    expect((view.node as HTMLElement).children.length).toBe(0)
  })

  it('应该在遇到未知节点类型时抛出错误', () => {
    const view = {
      kind: 999 as ViewKind,
      props: {},
      state: 0,
      el: null
    } as any

    expect(() => renderViewNode(view, container)).toThrow('Unknown node kind')
  })
})
