import { flushSync } from '@vitarx/responsive'
import { sleep } from '@vitarx/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createView } from '../../../core/index.js'
import type { HostElementTag, View } from '../../../types/index.js'
import { Lazy } from '../src/index.js'

describe('Lazy Component', () => {
  let container: HTMLElement
  const testTag = 'div' as HostElementTag

  const createLoader = () => {
    return (): Promise<{ default: () => View }> =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({ default: () => createView(testTag, { children: 'Loaded Content' }) })
        }, 10)
      })
  }

  const createErrorLoader = () => {
    return (): Promise<{ default: () => View }> =>
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Load failed'))
        }, 10)
      })
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    container.innerHTML = ''
  })

  describe('属性验证', () => {
    it('应该验证 loader 必须为函数', () => {
      expect(() => {
        Lazy.validateProps({ loader: 'not a function' as any })
      }).toThrowError()
    })

    it('应该验证 loading 必须为 View 或 undefined', () => {
      expect(() => {
        Lazy.validateProps({
          loader: createLoader(),
          loading: 'not a view' as any
        })
      }).toThrowError()
    })

    it('应该接受有效的 loading 属性', () => {
      expect(() => {
        Lazy.validateProps({
          loader: createLoader(),
          loading: () => createView(testTag, { children: 'Loading...' })
        })
      }).not.toThrow()
    })

    it('应该验证 onError 必须为函数或 undefined', () => {
      expect(() => {
        Lazy.validateProps({
          loader: createLoader(),
          onError: 'not a function' as any
        })
      }).toThrowError()
    })

    it('应该接受有效的 onError 属性', () => {
      expect(() => {
        Lazy.validateProps({
          loader: createLoader(),
          onError: (e: unknown) => createView(testTag, { children: 'Error occurred' })
        })
      }).not.toThrow()
    })
  })

  describe('基础功能', () => {
    it('应该在加载过程中显示初始占位符', () => {
      const view = createView(Lazy, {
        loader: createLoader()
      })
      view.mount(container)
      expect(container.innerHTML).toContain('Lazy')
    })

    it('应该在加载完成后显示组件内容', async () => {
      const view = createView(Lazy, {
        loader: createLoader()
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(container.textContent).toContain('Loaded Content')
    })

    it('应该支持 inject 属性传递给加载的组件', async () => {
      const createLoaderWithProps = () => {
        return (): Promise<{ default: (props: any) => View }> =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                default: (props: any) =>
                  createView(testTag, {
                    children: `Loaded with prop: ${props.testProp || 'no-prop'}`
                  })
              })
            }, 10)
          })
      }

      const view = createView(Lazy, {
        loader: createLoaderWithProps(),
        inject: { testProp: 'testValue' }
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(container.textContent).toContain('Loaded with prop: testValue')
    })

    it('应该支持 children 属性传递给加载的组件', async () => {
      const createLoaderWithChildren = () => {
        return (): Promise<{ default: (props: any) => View }> =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                default: (props: any) =>
                  createView(testTag, {
                    children: `Loaded with children: ${props.children || 'no-children'}`
                  })
              })
            }, 10)
          })
      }

      const view = createView(Lazy, {
        loader: createLoaderWithChildren(),
        children: 'Test Children'
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(container.textContent).toContain('Loaded with children: Test Children')
    })
  })

  describe('加载状态功能', () => {
    it('应该在指定延迟时间内显示 loading 内容', async () => {
      const loadingView = createView(testTag, { children: 'Delayed Loading...' })

      const view = createView(Lazy, {
        loader: createLoader(),
        loading: () => loadingView,
        delay: 0 // 使用较短的延迟时间进行测试
      })
      view.mount(container)

      expect(container.textContent).toContain('Delayed Loading...')
      await sleep(10)
      expect(container.textContent).toContain('Loaded Content')
    })

    it('应该在加载完成后替换 loading 内容', async () => {
      const loadingView = createView(testTag, { children: 'Loading...' })

      const view = createView(Lazy, {
        loader: createLoader(),
        loading: () => loadingView,
        delay: 0
      })
      view.mount(container)

      await sleep(20) // 等待加载完成

      expect(container.textContent).toContain('Loaded Content')
      expect(container.textContent).not.toContain('Loading...')
    })
  })

  describe('错误处理', () => {
    it('应该在加载失败时调用 onError 回调', async () => {
      const onError = vi.fn((e: unknown) =>
        createView(testTag, { children: `Error: ${(e as Error).message}` })
      )

      const view = createView(Lazy, {
        loader: createErrorLoader(),
        onError
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(onError).toHaveBeenCalled()
      expect(container.textContent).toContain('Error: Load failed')
    })

    it('应该在没有提供 onError 时记录错误日志', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const view = createView(Lazy, {
        loader: createErrorLoader()
      })
      view.mount(container)

      await sleep(20)
      flushSync()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ERROR] lazy loading component module fail - ',
        expect.objectContaining({ message: 'Load failed' }),
        undefined
      )

      consoleSpy.mockRestore()
    })
  })

  describe('超时处理', () => {
    it('应该在指定超时时间内完成加载', async () => {
      const view = createView(Lazy, {
        loader: createLoader(),
        timeout: 100 // 设置合理的超时时间
      })
      view.mount(container)

      await sleep(20)

      expect(container.textContent).toContain('Loaded Content')
    })
  })

  describe('生命周期', () => {
    it('应该正确处理组件的初始化和销毁', async () => {
      const view = createView(Lazy, {
        loader: createLoader()
      })

      // 初始化
      view.mount(container)
      expect(container.innerHTML).toContain('Lazy')

      // 加载完成
      await sleep(20)

      expect(container.textContent).toContain('Loaded Content')

      // 销毁
      view.dispose()
      expect(container.innerHTML).toBe('')
    })
  })

  describe('边界场景', () => {
    it('应该正确处理立即解析的loader', async () => {
      const immediateLoader = () =>
        Promise.resolve({
          default: () => {
            return createView(testTag, { children: 'Immediate Content' })
          }
        })

      const view = createView(Lazy, {
        loader: immediateLoader
      })
      view.mount(container)
      expect((view.node as Comment).parentElement).toBe(container)
      await sleep(0)
      expect(container.textContent).toContain('Immediate Content')
    })
  })
})
