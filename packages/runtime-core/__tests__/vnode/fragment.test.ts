import { ref } from '@vitarx/responsive'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement, Fragment, FragmentVNode, onUpdated, WidgetVNode } from '../../src'

describe('片段节点测试套件', () => {
  describe('创建节点测试', () => {
    it('应该正常渲染空片段节点', () => {
      const node = createElement(Fragment)
      expect(node.shadowElement.parentNode).toBe(node.element)
    })
    it('应该正常渲染有子节点的片段节点', () => {
      const node = createElement(
        Fragment,
        null,
        createElement('div'),
        createElement('span')
      ) as unknown as FragmentVNode
      const el = node.element
      expect(node.children[0].element.parentNode).toBe(el)
      expect(node.children[1].element.parentNode).toBe(el)
    })
  })
  describe('片段节点的更新', () => {
    const body = document.createElement('div')
    beforeEach(() => {
      body.innerHTML = ''
    })
    it('应该正常更新片段节点内容', async () => {
      const show = ref(false)
      const update = vi.fn()
      const mockWidget = () => {
        onUpdated(update)
        return () =>
          createElement(Fragment, null, createElement('div', { 'v-if': show.value }, 'test'))
      }
      const widgetNode = createElement(mockWidget) as unknown as WidgetVNode
      expect(widgetNode.child).toBeInstanceOf(FragmentVNode)
      widgetNode.mount(body)
      expect(body.innerHTML).toBe('<div>test</div>')
      show.value = true
      await vi.waitFor(() => {
        expect(update).toBeCalledTimes(1)
        expect(body.innerHTML).toBe('<!--v-if-->')
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
  })
})
