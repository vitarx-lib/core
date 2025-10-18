import { reactive, ref } from '@vitarx/responsive'
import { describe, expect, it, vi } from 'vitest'
import { createElement, Fragment, onMounted, onUpdated, WidgetVNode } from '../../src'

describe('update', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  it('支持基础更新', async () => {
    const show = ref(true)
    const callback = vi.fn()
    const childNode = createElement(() => {
      onMounted(callback)
      return createElement('span', null, 'test')
    })
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
  it('支持无key重新排序', async () => {
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
    expect(body1.textContent).toBe('123')
    expect(node1.deps?.size).greaterThan(0)
    arr.reverse()
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(body1.textContent).toBe('321')
    })
  })
  it('支持有key重新排序', async () => {
    const callback = vi.fn()
    const arr = reactive([1, 2, 3], false)
    import.meta.env.MODE = 'development'
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
    expect(body2.textContent).toBe('123')
    expect(node2.deps?.size).greaterThan(0)
    arr.reverse()
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
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
  it('支持指定位置/随机插入', async () => {
    import.meta.env.MODE = 'development'
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
    arr.splice(1, 0, arr.length + 1)
    await vi.waitFor(() => {
      expect(document.body.textContent).toBe('1423')
    })
  })
  it('支持 teleport 更新', async () => {
    const callback = vi.fn()
    const target = document.createElement('div') // 真实挂载父元素
    document.body.appendChild(target)

    const show = ref(true)
    const vnode = createElement(() => {
      onUpdated(callback)
      return () =>
        createElement('div', null, [
          createElement('span', { key: 1 }, 'A'),
          createElement('span', { key: 2, 'v-parent': show.value ? target : null }, 'B')
        ])
    }) as unknown as WidgetVNode

    const container = document.createElement('div')
    vnode.mount(container)

    // 初始状态
    expect(container.textContent).toBe('A') // b 不在 container
    expect(target.textContent).toBe('B')

    // 更新，移除 C
    show.value = false
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(container.textContent).toBe('AB')
      expect(target.textContent).toBe('')
    })

    show.value = true
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(2)
      expect(container.textContent).toBe('A')
      expect(target.textContent).toBe('B')
    })
  })
  it('支持 teleport 节点移动', async () => {
    const callback = vi.fn()
    const target = document.createElement('div')
    document.body.appendChild(target)

    const arr = reactive([1, 2, 3])

    const vnode = createElement(() => {
      onUpdated(callback)
      return () =>
        createElement(
          Fragment,
          null,
          arr.map(i =>
            createElement('span', { 'v-parent': i % 2 === 0 ? target : undefined }, String(i))
          )
        )
    })

    const container = document.createElement('div')
    vnode.mount(container)

    // 检查初始挂载
    expect(container.textContent).toBe('13')
    expect(target.textContent).toBe('2')

    // 反转数组，测试 LIS 移动
    arr.reverse() // [ 3,2,1 ]
    await vi.waitFor(() => {
      expect(callback).toBeCalled()
      expect(container.textContent).toBe('31')
      expect(target.textContent).toBe('2')
    })
    // 插入新节点
    arr.splice(1, 0, 4) // [ 3, 4, 2, 1 ]
    await vi.waitFor(() => {
      expect(container.textContent).toBe('31')
      expect(target.textContent).toBe('24')
    })

    // 删除节点
    arr.splice(0, 1) // [4,2,1]
    await vi.waitFor(() => {
      expect(container.textContent).toBe('1')
      expect(target.textContent).toBe('24')
    })
  })
})
