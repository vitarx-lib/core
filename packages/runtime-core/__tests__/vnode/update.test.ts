import { reactive, ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { createElement, Fragment, onMounted, onUpdated, WidgetVNode } from '../../src'

describe('update', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  it('should update', async () => {
    const show = ref(true)
    const callback = vi.fn()
    const childNode = createElement(() => {
      onMounted(callback)
      return createElement('span', null, 'test')
    }) as unknown as WidgetVNode
    const vnode = createElement(() => {
      return () => (show.value ? createElement(Fragment) : childNode)
    })
    vnode.mount(document.body)
    show.value = false
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(childNode.state).toBe('activated')
      expect(vnode.element).toBeInstanceOf(HTMLSpanElement)
    })
  })
  it('支持重新排序', async () => {
    const callback = vi.fn()
    const arr = reactive([1, 2, 3], false)
    import.meta.env.MODE = 'development'
    const node1 = createElement(() => {
      onUpdated(callback)
      return () =>
        createElement(
          Fragment,
          null,
          arr.map(item => createElement('span', null, item))
        )
    })
    const body1 = document.createElement('div')
    node1.mount(body1)
    const node2 = createElement(() => {
      onUpdated(callback)
      return () =>
        createElement(
          Fragment,
          null,
          arr.map(item => createElement('span', { key: item }, item))
        )
    })
    const body2 = document.createElement('div')
    node2.mount(body2)
    expect(body1.textContent).toBe('123')
    expect(body2.textContent).toBe('123')
    expect(node1.deps?.size).greaterThan(0)
    expect(node2.deps?.size).greaterThan(0)
    arr.reverse()
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(body1.textContent).toBe('321')
      expect(body2.textContent).toBe('321')
    })
  })
  it('支持动态添加和删除', async () => {
    const callback = vi.fn()
    const arr = reactive([1, 2, 3], false)
    const node = createElement(() => {
      onUpdated(callback)
      return () =>
        createElement(
          Fragment,
          null,
          arr.map(item => createElement('span', null, item))
        )
    })
    node.mount(document.body)
    expect(document.body.textContent).toBe('123')
    arr.push(4)
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(document.body.textContent).toBe('1234')
    })
    arr.shift()
    await vi.waitFor(() => {
      expect(document.body.textContent).toBe('234')
    })
    arr.unshift(0)
    await vi.waitFor(() => {
      expect(document.body.textContent).toBe('0234')
    })
    arr.pop()
    await vi.waitFor(() => {
      expect(document.body.textContent).toBe('023')
    })
    arr.splice(1, 1)
    await vi.waitFor(() => {
      expect(document.body.textContent).toBe('03')
    })
  })
  it('支持随机插入', async () => {
    const arr = reactive([1, 2, 3] as number[], false)
    const node = createElement(() => {
      return () =>
        createElement(
          'ul',
          null,
          arr.map(item => createElement('li', { key: item }, item))
        )
    })
    node.mount(document.body)
    for (let i = 1; i < 5; i++) {
      arr.splice(Math.floor(Math.random() * arr.length), 0, arr.length + 1)
      await vi.waitFor(() => {
        expect(document.body.textContent.length).toBe(3 + i)
      })
    }
  })
})
