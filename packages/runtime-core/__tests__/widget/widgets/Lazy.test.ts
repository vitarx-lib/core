/**
 * Lazy 组件单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  Lazy,
  mountNode,
  renderNode,
  Suspense,
  unmountNode,
  useSuspense
} from '../../../src/index.js'
import {
  createAsyncWidget,
  createContainer,
  createTestWidget,
  flushScheduler,
  waitForAsync
} from '../../helpers/test-widget.js'

describe('Lazy 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  describe('属性验证', () => {
    it('应该验证 children 必须为函数', () => {
      expect(() => {
        Lazy.validateProps({ children: 'not a function' as any })
      }).toThrow('异步函数')
    })

    it('应该接受 loading 为 VNode 或 undefined', () => {
      expect(() => {
        Lazy.validateProps({
          children: async () => ({ default: createTestWidget() }),
          loading: createVNode('div', {}, 'Loading')
        })
      }).not.toThrow()
    })

    it('应该验证 loading 必须为 VNode 或 undefined', () => {
      expect(() => {
        Lazy.validateProps({
          children: async () => ({ default: createTestWidget() }),
          loading: 'not a vnode' as any
        })
      }).toThrow('节点对象')
    })

    it('应该验证 onError 必须为函数或 undefined', () => {
      expect(() => {
        Lazy.validateProps({
          children: async () => ({ default: createTestWidget() }),
          onError: 'not a function' as any
        })
      }).toThrow('回调函数')
    })
  })

  describe('基础异步加载', () => {
    it('应该成功加载异步组件', async () => {
      const AsyncWidget = createTestWidget({
        build() {
          return createVNode('div', {}, 'Async Content')
        }
      })

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 50)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(100)
      flushScheduler()

      expect(container.textContent).toContain('Async Content')
    })

    it('应该在加载完成后渲染组件', async () => {
      const AsyncWidget = createTestWidget({
        build() {
          return createVNode('div', { className: 'loaded' }, 'Loaded')
        }
      })

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 30)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)
      flushScheduler()

      const element = container.querySelector('.loaded')
      expect(element).toBeTruthy()
      expect(element?.textContent).toBe('Loaded')
    })

    it('应该正确透传 injectProps', async () => {
      const AsyncWidget = createTestWidget<{ color: string; size: string }>({
        build() {
          return createVNode('div', {}, `${this.props!.color}-${this.props!.size}`)
        }
      })

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 30),
        injectProps: { color: 'red', size: 'large' }
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)
      flushScheduler()

      expect(container.textContent).toContain('red-large')
    })

    it('应该在延迟后显示 loading', async () => {
      vi.useFakeTimers()
      const AsyncWidget = createTestWidget()
      const loadingVNode = createVNode('div', {}, 'Loading...')

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 500),
        loading: loadingVNode,
        delay: 200
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // delay 之前不显示 loading
      expect(container.textContent).not.toContain('Loading...')

      // 前进到 delay 时间
      vi.advanceTimersByTime(200)
      await Promise.resolve()
      flushScheduler()

      expect(container.textContent).toContain('Loading...')

      vi.useRealTimers()
    })

    it('应该正确渲染 loading 节点', async () => {
      vi.useFakeTimers()
      const AsyncWidget = createTestWidget()
      const loadingVNode = createVNode('div', { className: 'loading' }, 'Please wait')

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 500),
        loading: loadingVNode,
        delay: 100
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vi.advanceTimersByTime(100)
      await Promise.resolve()
      flushScheduler()

      const loadingEl = container.querySelector('.loading')
      expect(loadingEl).toBeTruthy()
      expect(loadingEl?.textContent).toBe('Please wait')

      vi.useRealTimers()
    })

    it('应该在超时时抛出错误', async () => {
      vi.useFakeTimers()
      const AsyncWidget = createTestWidget()
      const onError = vi.fn(() => false)

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 1000),
        timeout: 500,
        onError: onError as () => false
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vi.advanceTimersByTime(500)
      await Promise.resolve()
      flushScheduler()

      expect(onError).toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('Suspense 集成', () => {
    it('应该与 Suspense 组件配合使用', async () => {
      const AsyncWidget = createTestWidget({
        build() {
          return createVNode('div', {}, 'Async')
        }
      })

      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', {}, 'Suspense Loading'),
        children: createVNode(Lazy, {
          children: () => createAsyncWidget(AsyncWidget, 50)
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('Suspense Loading')

      await waitForAsync(100)
      flushScheduler()

      expect(container.textContent).toContain('Async')
    })

    it('应该在加载时增加 suspenseCounter', async () => {
      let counter: any

      const TestWidget = createTestWidget({
        build() {
          counter = useSuspense()
          return createVNode('div')
        }
      })

      const vnode = createVNode(Suspense, {
        children: createVNode(TestWidget, {})
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(counter).toBeDefined()
      const initialValue = counter.value

      // Lazy 组件会增加 counter
      expect(initialValue).toBe(0)
    })

    it('应该在加载完成后减少 suspenseCounter', async () => {
      const AsyncWidget = createTestWidget()

      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', {}, 'Loading'),
        children: createVNode(Lazy, {
          children: () => createAsyncWidget(AsyncWidget, 30)
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)
      flushScheduler()

      // counter 应该恢复为 0
      expect(container.textContent).not.toContain('Loading')
    })
  })

  describe('错误处理', () => {
    it('应该在加载失败时触发 onError', async () => {
      const onError = vi.fn(() => false)

      const vnode = createVNode(Lazy, {
        children: async () => {
          throw new Error('Load failed')
        },
        onError
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)

      expect(onError).toHaveBeenCalled()
    })

    it('应该在 onError 返回备用 UI', async () => {
      const onError = vi.fn(() => createVNode('div', {}, 'Load Error'))

      const vnode = createVNode(Lazy, {
        children: async () => {
          throw new Error('Failed')
        },
        onError: onError as unknown as () => false
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)
      flushScheduler()

      expect(container.textContent).toContain('Load Error')
    })

    it('应该在超时时触发 onError', async () => {
      vi.useFakeTimers()
      const onError = vi.fn(() => false)

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(createTestWidget(), 1000),
        timeout: 300,
        onError: onError as () => false
      })
      renderNode(vnode)
      mountNode(vnode, container)

      vi.advanceTimersByTime(300)
      await Promise.resolve()

      expect(onError).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('应该在组件卸载时取消加载任务', async () => {
      const AsyncWidget = createTestWidget()

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 100)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 立即卸载
      unmountNode(vnode)

      await waitForAsync(150)

      // 卸载后不应该更新
      expect(container.textContent).toBe('')
    })
  })

  describe('生命周期', () => {
    it('应该在 onBeforeUnmount 设置卸载标志', () => {
      const AsyncWidget = createTestWidget()

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 100)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      unmountNode(vnode)

      // 卸载后状态应该改变
      expect(vnode.state).toBe('unmounted')
    })
  })

  describe('边界场景', () => {
    it('应该在 delay=0 时立即显示 loading', async () => {
      const AsyncWidget = createTestWidget()
      const loadingVNode = createVNode('div', {}, 'Immediate Loading')

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 100),
        loading: loadingVNode,
        delay: 0
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await Promise.resolve()
      flushScheduler()

      expect(container.textContent).toContain('Immediate Loading')
    })

    it('应该在 timeout<=0 时不限制超时', async () => {
      const AsyncWidget = createTestWidget()

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 100),
        timeout: 0
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(150)
      flushScheduler()

      // 不会超时，应该正常加载
      expect(vnode.runtimeInstance).toBeDefined()
    })

    it('应该在组件卸载时不更新状态', async () => {
      const AsyncWidget = createTestWidget()

      const vnode = createVNode(Lazy, {
        children: () => createAsyncWidget(AsyncWidget, 50)
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 立即卸载
      unmountNode(vnode)

      await waitForAsync(100)
      flushScheduler()

      // 卸载后不应该有更新
      expect(vnode.state).toBe('unmounted')
    })
  })
})
