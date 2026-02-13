import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ViewKind } from '../../../src/index.js'
import { FragmentView } from '../../../src/view/implements'

describe('FragmentView', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 FragmentView 实例', () => {
    const fragmentView = new FragmentView('test text')

    expect(fragmentView).toBeInstanceOf(FragmentView)
    expect(fragmentView.kind).toBe(ViewKind.FRAGMENT)
    expect(fragmentView.children.length).toBe(1)
  })

  it('应该接受 location 参数', () => {
    const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
    const fragmentView = new FragmentView('test text', location)

    expect(fragmentView.location).toBe(location)
  })

  it('应该处理空子元素', () => {
    const fragmentView = new FragmentView(null)

    expect(fragmentView.children.length).toBe(0)
  })

  it('应该处理多个子元素', () => {
    const fragmentView = new FragmentView(['text 1', 'text 2', 'text 3'])

    expect(fragmentView.children.length).toBe(3)
  })

  it('应该能够初始化、挂载和销毁', () => {
    const fragmentView = new FragmentView('test text')

    expect(() => {
      fragmentView.init()
    }).not.toThrow()

    expect(() => {
      fragmentView.mount(container)
    }).not.toThrow()

    expect(() => {
      fragmentView.dispose()
    }).not.toThrow()
  })

  it('应该能够激活和停用', () => {
    const fragmentView = new FragmentView('test text')
    fragmentView.init()
    fragmentView.mount(container)

    expect(() => {
      fragmentView.deactivate()
    }).not.toThrow()

    expect(() => {
      fragmentView.activate()
    }).not.toThrow()
  })

  it('应该在 DOM 中渲染子元素', () => {
    const fragmentView = new FragmentView(['text 1', 'text 2'])
    fragmentView.init()
    fragmentView.mount(container)

    expect(container.textContent).toBe('text 1text 2')
  })
})
