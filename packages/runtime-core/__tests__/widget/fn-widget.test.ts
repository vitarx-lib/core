import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { createElement, createVNode, ElementVNode, onUpdated, WidgetVNode } from '../../src'

const body = document.createElement('div')
describe('函数组件测试套件', () => {
  it('应该正常渲染组件', () => {
    const Test = (props: { name: string }) => {
      return createVNode('div', { children: props.name })
    }
    const node = createVNode(Test, { name: 'test' })
    node.mount(body)
    expect(body.innerHTML).toBe('<div>test</div>')
  })
  it('应该支持渲染异步组件', async () => {
    body.innerHTML = ''
    const Test = async (props: { name: string }) => {
      await new Promise(resolve => setTimeout(resolve))
      return createVNode('div', { children: props.name })
    }
    const node = createVNode(Test, { name: 'test' })
    node.mount(body)
    await vi.waitFor(() => {
      expect(body.innerHTML).toBe('<div>test</div>')
    })
  })
  it('应该正常更新子元素内容', async () => {
    body.innerHTML = ''
    const count = ref(0)
    const update = vi.fn()
    const inc = createElement(
      'button',
      {
        onClick: () => count.value++
      },
      '增加'
    )
    const mockWidget = () => {
      onUpdated(update)
      return () => {
        return createElement(
          'div',
          null,
          createElement('div', { className: 'counter-display', id: 'counter' }, count),
          createElement('div', { className: 'counter-controls' }, inc)
        )
      }
    }
    const widgetNode = createElement(mockWidget) as unknown as WidgetVNode
    expect(widgetNode.child).toBeInstanceOf(ElementVNode)
    widgetNode.mount(body)
    const counter = body.querySelector('#counter')
    expect(counter).toBeInstanceOf(HTMLDivElement)
    expect(counter?.textContent).toBe('0')
    inc.element.dispatchEvent(new MouseEvent('click'))
    await vi.waitFor(async () => {
      expect(update).toBeCalledTimes(1)
      expect(counter?.textContent).toBe(`${count.value}`)
      count.value = 0
      await vi.waitFor(() => {
        expect(counter?.textContent).toBe(`${count.value}`)
      })
    })
  })
})
