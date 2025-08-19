import { ref } from '@vitarx/responsive'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  KeepAlive,
  type KeepAliveProps,
  onDeactivated,
  onUnmounted,
  TextVNode,
  Widget,
  WidgetVNode
} from '../../src/index'

const body = document.createElement('div')

// 组件被停用时的回调函数
const onDeactivatedCallback = vi.fn()
const onUnmountedCallback = vi.fn()
// 创建模拟函数组件
const mockFnWidget = () => {
  onDeactivated(onDeactivatedCallback)
  onUnmounted(onUnmountedCallback)
  return new TextVNode('Mock Fn Widget')
}

class MockWidget extends Widget<Partial<Pick<KeepAliveProps, 'exclude' | 'include'>>> {
  key: number = 1
  child = ref(new WidgetVNode(mockFnWidget, { key: this.key }), { deep: false })

  test(change: boolean) {
    if (change) this.key++
    this.child.value = new WidgetVNode(mockFnWidget, { key: this.key })
  }

  build() {
    return createVNode(KeepAlive, {
      children: this.child.value,
      exclude: this.props.exclude,
      include: this.props.include
    })
  }
}

describe('KeepAlive缓存组件测试', () => {
  afterEach(() => {
    // 清理mock函数调用记录
    onDeactivatedCallback.mockClear()
    body.innerHTML = ''
  })
  it('应该正常被缓存', async () => {
    const node = new WidgetVNode(MockWidget).mount(body)
    node.instance.test(true)
    await vi.waitFor(() => {
      expect(onDeactivatedCallback).toBeCalledTimes(1)
      expect(body.textContent === 'Mock Fn Widget')
    })
  })
  it('应该根据include决定是否缓存', async () => {
    const node = new WidgetVNode(MockWidget, { include: [() => null] }).mount(body)
    node.instance.test(true)
    await vi.waitFor(() => {
      // 没有被缓存
      expect(onDeactivatedCallback).not.toHaveBeenCalled()
      expect(onUnmountedCallback).toBeCalledTimes(1)
    })
  })
  it('应该根据include决定是否缓存', async () => {
    const node = new WidgetVNode(MockWidget, { exclude: [mockFnWidget] }).mount(body)
    node.instance.test(true)
    await vi.waitFor(() => {
      expect(onDeactivatedCallback).not.toHaveBeenCalled()
      expect(onUnmountedCallback).toBeCalledTimes(1)
    })
  })
})
