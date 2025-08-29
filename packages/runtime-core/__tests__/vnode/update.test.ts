import { ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { createElement, Fragment, onMounted, WidgetVNode } from '../../src'

describe('update', () => {
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
})
