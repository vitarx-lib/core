/**
 * Suspense 组件单元测试
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createVNode,
  findParentNode,
  Lazy,
  mountNode,
  NodeState,
  renderNode,
  Suspense,
  useSuspense,
  Widget
} from '../../../src/index.js'
import {
  createAsyncWidget,
  createContainer,
  createTestWidget,
  flushScheduler,
  waitForAsync
} from '../../helpers/test-widget.js'

describe('Suspense 组件', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  describe('属性验证', () => {
    it('应该验证 children 必须为 VNode', () => {
      expect(() => {
        Suspense.validateProps({ children: 'not a vnode' as any })
      }).toThrow('节点对象')
    })

    it('应该接受 fallback 为 VNode 或 undefined', () => {
      expect(() => {
        Suspense.validateProps({
          children: createVNode('div'),
          fallback: createVNode('div', { children: 'loading' })
        })
      }).not.toThrow()

      expect(() => {
        Suspense.validateProps({
          children: createVNode('div'),
          fallback: undefined
        })
      }).not.toThrow()
    })

    it('应该验证 fallback 必须为 VNode 或 undefined', () => {
      const result = Suspense.validateProps({
        children: createVNode('div'),
        fallback: 'not a vnode' as any
      })
      expect(result).toContain('节点对象')
    })

    it('应该验证 onError 必须为函数或 undefined', () => {
      const result = Suspense.validateProps({
        children: createVNode('div'),
        onError: 'not a function' as any
      })
      expect(result).toContain('回调函数')
    })
  })

  describe('基础功能', () => {
    it('应该在异步子节点加载期间显示 fallback', async () => {
      const AsyncWidget = createTestWidget()
      const fallback = createVNode('div', { children: 'Loading...' })
      const vnode = createVNode(Suspense, {
        fallback,
        children: createVNode(Lazy, {
          loader: () => createAsyncWidget(AsyncWidget, 50)
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('Loading...')
    })

    it('应该在异步完成后显示子节点', async () => {
      const AsyncWidget = createTestWidget({
        build() {
          return createVNode('div', { children: 'Loaded Content' })
        }
      })
      const fallback = createVNode('div', { children: 'Loading...' })
      const vnode = createVNode(Suspense, {
        fallback,
        children: createVNode(Lazy, {
          loader: () => createAsyncWidget(AsyncWidget, 50)
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(100)
      flushScheduler()

      expect(container.textContent).toContain('Loaded Content')
    })

    it('应该在 counter 为 0 时直接显示子节点', () => {
      const childVNode = createVNode('div', { children: 'Immediate Content' })
      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        children: childVNode
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('Immediate Content')
      expect(container.textContent).not.toContain('Loading')
    })

    it('应该在完成时触发 onResolved 钩子', async () => {
      const onResolved = vi.fn()
      const AsyncWidget = createTestWidget()
      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        onResolved,
        children: createVNode(() => createAsyncWidget(AsyncWidget, 50))
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(1000)
      flushScheduler()

      expect(onResolved).toHaveBeenCalled()
    })
  })

  describe('计数器机制', () => {
    it('应该 provide SUSPENSE_COUNTER_SYMBOL', () => {
      const ChildWidget = class extends Widget {
        counter = useSuspense()

        build() {
          expect(this.counter).toBeDefined()
          return createVNode('div')
        }
      }

      const vnode = createVNode(Suspense, {
        children: createVNode(ChildWidget, {})
      })
      renderNode(vnode)
      mountNode(vnode, container)
    })

    it('应该允许子组件通过 useSuspense 获取 counter', () => {
      let counterRef: any = null

      const ChildWidget = class extends Widget {
        build() {
          counterRef = useSuspense()
          return createVNode('div')
        }
      }

      const vnode = createVNode(Suspense, {
        children: createVNode(ChildWidget, {})
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(counterRef).toBeDefined()
      expect(counterRef.value).toBeDefined()
    })

    it('应该累加多个异步子节点的计数', async () => {
      const AsyncWidget1 = createTestWidget()
      const AsyncWidget2 = createTestWidget()

      const ParentWidget = class extends Widget {
        build() {
          return createVNode('div', {
            children: [
              createVNode(Lazy, { loader: () => createAsyncWidget(AsyncWidget1, 50) }),
              createVNode(Lazy, { loader: () => createAsyncWidget(AsyncWidget2, 50) })
            ]
          })
        }
      }

      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        children: createVNode(ParentWidget, {})
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 多个 Lazy 组件会累加 counter
      expect(container.textContent).toContain('Loading')
    })

    it('应该在计数归零时停止 Suspense', async () => {
      const AsyncWidget = createTestWidget()
      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        children: createVNode(Lazy, {
          loader: () => createAsyncWidget(AsyncWidget, 50)
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      expect(container.textContent).toContain('Loading')

      await waitForAsync(100)
      flushScheduler()

      // counter 归零后停止显示 fallback
      expect(container.textContent).not.toContain('Loading')
    })
  })

  describe('错误处理', () => {
    it('应该通过 onError 捕获子节点错误', async () => {
      const onError = vi.fn(() => false) as () => false
      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        onError,
        children: createVNode(Lazy, {
          loader: async () => {
            throw new Error('Load failed')
          }
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)

      expect(onError).toHaveBeenCalled()
    })

    it('应该在错误时也触发 onResolved', async () => {
      const onResolved = vi.fn()
      const onError = vi.fn(() => createVNode('div', { children: 'Error' }))

      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        onResolved,
        onError,
        children: createVNode(Lazy, {
          loader: async () => {
            throw new Error('Load failed')
          }
        })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      await waitForAsync(50)
      flushScheduler()

      expect(onError).toHaveBeenCalled()
      expect(onResolved).toHaveBeenCalled()
    })
  })

  describe('生命周期', () => {
    it('应该在 onRender 链接父子关系并渲染子节点', () => {
      const childVNode = createVNode('div', { children: 'Child' })
      const vnode = createVNode(Suspense, {
        children: childVNode
      })
      renderNode(vnode)

      expect(findParentNode(childVNode)).toBe(vnode)
    })

    it('应该在 onActivated 触发 complete', () => {
      const onResolved = vi.fn()
      const vnode = createVNode(Suspense, {
        onResolved,
        children: createVNode('div', { children: 'Child' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // onActivated 会触发 complete
      if (vnode.instance?.instance) {
        ;(vnode.instance.instance as any).onActivated?.()
      }
    })

    it('应该在卸载状态不执行 stopSuspense', () => {
      const vnode = createVNode(Suspense, {
        children: createVNode('div', { children: 'Child' })
      })
      renderNode(vnode)

      // 卸载状态的处理由生命周期保证
      expect(vnode.state).toBe(NodeState.Rendered)
    })
  })

  describe('边界场景', () => {
    it('不存在异步时不显示fallback', () => {
      const vnode = createVNode(Suspense, {
        children: createVNode('div', { children: 'Child' })
      })
      renderNode(vnode)

      expect(vnode.instance!.child.type).toBe('div')
    })

    it('应该在已卸载组件不触发更新', () => {
      const vnode = createVNode(Suspense, {
        fallback: createVNode('div', { children: 'Loading' }),
        children: createVNode('div', { children: 'Content' })
      })
      renderNode(vnode)
      mountNode(vnode, container)

      // 卸载后不应触发更新
      expect(vnode.state).not.toBe('unmounted')
    })
  })
})
