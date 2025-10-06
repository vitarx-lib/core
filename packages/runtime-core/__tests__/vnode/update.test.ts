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
    expect(node.deps?.size).greaterThan(0)
    arr.reverse()
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(document.body.textContent).toBe('321')
    })
  })
})
