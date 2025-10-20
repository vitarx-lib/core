import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createElement,
  DomHelper,
  Fragment,
  FragmentVNode,
  onUpdated,
  WidgetVNode
} from '../../src'

describe('片段节点测试套件', () => {
  describe('创建节点测试', () => {
    it('应该正常渲染空片段节点', () => {
      const body = document.createElement('div')
      const node = createElement(Fragment) as unknown as FragmentVNode
      node.mount(body)
      const element = node.element
      expect(body.childNodes[0]).toBe(element.$startAnchor)
      expect(body.childNodes[1]).toBe(element.$endAnchor)
    })
    it('应该正常渲染有子节点的片段节点', () => {
      const node = createElement(
        Fragment,
        null,
        createElement('div'),
        createElement('span')
      ) as unknown as FragmentVNode
      node.mount()
      expect(node.children[0].element.parentNode).toBe(node.element)
      expect(node.children[1].element.parentNode).toBe(node.element)
    })
  })
  describe('片段节点的更新', () => {
    const body = document.createElement('div')
    beforeEach(() => {
      body.innerHTML = ''
    })
    it('应该正常更新片段节点内容', async () => {
      const show = ref(true)
      const update = vi.fn()
      const mockWidget = () => {
        onUpdated(update)
        return () =>
          createElement(Fragment, null, createElement('div', { 'v-if': show.value }, 'test'))
      }
      const widgetNode = createElement(mockWidget) as unknown as WidgetVNode
      expect(widgetNode.child).toBeInstanceOf(FragmentVNode)
      widgetNode.mount(body)
      expect(body.childNodes[1].textContent).toBe(`test`)
      show.value = false
      await vi.waitFor(() => {
        expect(update).toBeCalledTimes(1)
        expect(body.childNodes[1].nodeValue).toBe('v-if')
      })
    })
    it('应该正常替换片段节点', async () => {
      const show = ref(true)
      const update = vi.fn()
      const mockWidget = () => {
        onUpdated(update)
        return () => {
          return show.value ? createElement(Fragment, null) : createElement('div', null, 'test')
        }
      }
      const widgetNode = createElement(mockWidget) as unknown as WidgetVNode
      expect(widgetNode.child).toBeInstanceOf(FragmentVNode)
      widgetNode.mount(body)
      expect(body.childNodes[0]).toBeInstanceOf(Comment)
      show.value = false
      await vi.waitFor(() => {
        expect(update).toBeCalledTimes(1)
        expect(body.innerHTML).toBe('<div>test</div>')
      })
    })
    it('应该正常往片段节点之前插入元素', async () => {
      const node1 = createElement(Fragment)
      node1.mount(body)
      const node2 = createElement(Fragment)
      DomHelper.insertBefore(node2.element, node1.element)
      expect(body.childNodes[0]).toBe(node2.element.$startAnchor)
    })
    it('应该正常往片段节点之后插入元素', async () => {
      const node1 = createElement(Fragment)
      node1.mount(body)
      const node2 = createElement('div')
      DomHelper.insertAfter(node2.element, node1.element)
      expect(body.childNodes[2]).toBe(node2.element)
    })
  })
})
