import { nextTick, ref } from '@vitarx/responsive'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ViewKind } from '../../../src/index.js'
import { ElementView } from '../../../src/view/implements'

describe('ElementView', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('应该创建一个 ElementView 实例', () => {
    const elementView = new ElementView('div')

    expect(elementView).toBeInstanceOf(ElementView)
    expect(elementView.kind).toBe(ViewKind.ELEMENT)
    expect(elementView.tag).toBe('div')
    expect(elementView.props).toBeNull()
    expect(elementView.children).toEqual([])
  })

  it('应该接受 location 参数', () => {
    const location = { fileName: 'test.ts', lineNumber: 1, columnNumber: 1 }
    const elementView = new ElementView('div', null, location)

    expect(elementView.location).toBe(location)
  })

  it('应该处理带有属性的情况', () => {
    const props = {
      id: 'test',
      className: 'container',
      style: 'color: red'
    }
    const elementView = new ElementView('div', props)

    expect(elementView.props).toEqual(props)
  })

  it('应该处理带有子元素的情况', () => {
    const elementView = new ElementView('div', {
      children: 'test text'
    })

    expect(elementView.children.length).toBe(1)
  })

  it('应该能够初始化、挂载和销毁', () => {
    const elementView = new ElementView('div', {
      children: 'test text'
    })

    expect(() => {
      elementView.init()
    }).not.toThrow()

    expect(() => {
      elementView.mount(container)
    }).not.toThrow()

    expect(() => {
      elementView.dispose()
    }).not.toThrow()
  })

  it('应该能够激活和停用', () => {
    const elementView = new ElementView('div', {
      children: 'test text'
    })
    elementView.init()
    elementView.mount(container)

    expect(() => {
      elementView.deactivate()
    }).not.toThrow()

    expect(() => {
      elementView.activate()
    }).not.toThrow()
  })

  it('应该在 DOM 中创建元素节点', () => {
    const elementView = new ElementView('div', {
      id: 'test',
      className: 'container',
      children: 'test text'
    })
    elementView.init()
    elementView.mount(container)

    expect(container.childNodes.length).toBe(1)
    const divElement = container.childNodes[0] as HTMLDivElement
    expect(divElement.tagName).toBe('DIV')
    expect(divElement.id).toBe('test')
    expect(divElement.className).toBe('container')
    expect(divElement.textContent).toBe('test text')
  })

  it('应该处理响应式属性', async () => {
    const textRef = ref('test text')
    const elementView = new ElementView('div', {
      children: textRef
    })
    elementView.init()
    elementView.mount(container)

    expect(container.textContent).toBe('test text')

    // 更新响应式属性
    textRef.value = 'updated text'
    await nextTick()

    expect(container.textContent).toBe('updated text')
  })

  it('应该处理事件处理器', () => {
    const clickHandler = vi.fn()
    const elementView = new ElementView('button', {
      onClick: clickHandler,
      children: 'Click me'
    })
    elementView.init()
    elementView.mount(container)

    const buttonElement = container.childNodes[0] as HTMLButtonElement
    buttonElement.click()

    expect(clickHandler).toHaveBeenCalled()
  })

  it('应该处理引用', () => {
    let refElement: HTMLDivElement | null = null
    const elementRef = (el: HTMLDivElement) => {
      refElement = el
    }

    const elementView = new ElementView('div', {
      ref: elementRef,
      children: 'test'
    })
    elementView.init()
    elementView.mount(container)

    expect(refElement).toBeTruthy()
    expect(refElement!.tagName).toBe('DIV')
  })
})
