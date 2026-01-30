import { flushSync } from '@vitarx/responsive'
import { sleep } from '@vitarx/utils'
import { afterEach, beforeEach, describe } from 'vitest'
import { createView } from '../../../core/index.js'
import { useSuspense } from '../../../runtime/index.js'
import type { HostElementTag, View } from '../../../types/index.js'
import { Lazy } from '../../Lazy/src/index.js'
import { Suspense } from '../src/index.js'

describe('Suspense Component', () => {
  let container: HTMLElement
  const testTag = 'div' as HostElementTag
  const fallback = createView(testTag, { children: 'Loading...' })
  const createLoader = () => {
    return (): Promise<{ default: () => View }> =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({ default: () => createView(testTag, { children: 'Loaded Content' }) })
        }, 10)
      })
  }
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    fallback.dispose()
    document.body.removeChild(container)
    container.innerHTML = ''
  })
  describe('属性验证', () => {
    it('应该验证 children 必须为 View', () => {
      expect(() => {
        Suspense.validateProps({ children: 'not a view' as any })
      }).toThrowError()
    })

    it('应该接受 fallback 为 View 或 undefined', () => {
      expect(() => {
        Suspense.validateProps({
          children: createView(testTag),
          fallback: createView(testTag, { children: 'loading' })
        })
      }).not.toThrow()

      expect(() => {
        Suspense.validateProps({
          children: createView(testTag),
          fallback: undefined
        })
      }).not.toThrow()
    })

    it('应该验证 fallback 必须为 View 或 undefined', () => {
      expect(() => {
        Suspense.validateProps({
          children: createView(testTag),
          fallback: 'not a view' as any
        })
      }).toThrowError()
    })
  })

  describe('基础功能', () => {
    it('应该在异步子节点加载期间显示 fallback', async () => {
      const view = createView(Suspense, {
        fallback,
        children: createView(Lazy, {
          loader: createLoader()
        })
      })
      view.mount(container)

      expect(container.textContent).toContain('Loading...')
    })

    it('应该在异步完成后显示子节点', async () => {
      const view = createView(Suspense, {
        fallback,
        children: createView(Lazy, {
          loader: createLoader()
        })
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(container.textContent).toContain('Loaded Content')
    })

    it('应该在 counter 为 0 时直接显示子节点', () => {
      const childView = createView(testTag, { children: 'Immediate Content' })
      const view = createView(Suspense, {
        fallback: fallback,
        children: childView
      })
      view.mount(container)

      expect(container.textContent).toContain('Immediate Content')
      expect(container.textContent).not.toContain('Loading')
    })

    it('应该在完成时触发 onResolved 钩子', async () => {
      const onResolved = vi.fn()
      const view = createView(Suspense, {
        fallback: fallback,
        onResolved,
        children: createView(Lazy, {
          loader: createLoader()
        })
      })
      view.mount(container)

      await sleep(1000)

      expect(onResolved).toHaveBeenCalled()
    })
  })

  describe('计数器机制', () => {
    it('应该允许子组件通过 useSuspense 获取 counter', () => {
      const view = createView(Suspense, {
        children: createView(function () {
          expect(useSuspense()).toBeDefined()
          return null
        })
      })
      view.mount(container)
    })

    it('应该累加多个异步子节点的计数', async () => {
      const AsyncView1 = createView(Lazy, {
        loader: createLoader()
      })
      const AsyncView2 = createView(Lazy, {
        loader: createLoader()
      })

      const ParentWidget = () => {
        return createView(testTag, {
          children: [AsyncView1, AsyncView2]
        })
      }

      const view = createView(Suspense, {
        fallback: fallback,
        children: createView(ParentWidget, {})
      })
      view.mount(container)

      // 多个 Lazy 组件会累加 counter
      expect(container.textContent).toContain('Loading...')
    })

    it('应该在计数归零时停止 Suspense', async () => {
      const view = createView(Suspense, {
        fallback: fallback,
        children: createView(Lazy, {
          loader: createLoader()
        })
      })
      view.mount(container)

      expect(container.textContent).toContain('Loading...')

      await sleep(20)
      // counter 归零后停止显示 fallback
      expect(container.textContent).not.toContain('Loading...')
    })
  })

  describe('回调事件', () => {
    it('应该支持 onResolved', async () => {
      const onResolved = vi.fn()

      const view = createView(Suspense, {
        fallback,
        onResolved,
        children: createView(Lazy, {
          loader: createLoader()
        })
      })
      view.mount(container)

      await sleep(50)

      expect(onResolved).toHaveBeenCalled()
    })
  })

  describe('生命周期', () => {
    it('应该在 onInit 中链接父子关系并初始化子节点', () => {
      const childView = createView(testTag, { children: 'Child' })
      const view = createView(Suspense, {
        children: childView
      })
      view.init()
      expect(childView.owner).toBe(view.instance)
    })
  })

  describe('边界场景', () => {
    it('不存在异步时不显示fallback', () => {
      const child = createView(testTag, { children: 'Child' })
      const view = createView(Suspense, {
        fallback,
        children: child
      })
      view.init()
      expect(fallback.isUnused).toBe(true)
      expect(child.isInitialized).toBe(true)
    })
  })
})
