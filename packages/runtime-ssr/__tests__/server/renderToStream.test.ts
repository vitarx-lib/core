import { h, onDispose } from '@vitarx/runtime-core'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, renderToStream } from '../../src/index.js'
import { createMockAsyncComponent } from '../helpers.js'

describe('renderToStream', () => {
  it('应该流式传输HTML内容', async () => {
    const App = () => h('div', null, 'Hello Stream')
    const app = createSSRApp(App)
    const chunks: string[] = []

    await renderToStream(
      app,
      {},
      {
        push(content) {
          chunks.push(content)
        },
        close() {},
        error(err) {
          throw err
        }
      }
    )

    const html = chunks.join('')
    expect(html).toContain('Hello Stream')
  })

  it('渲染后应该调用close', async () => {
    const App = () => h('div', null, 'Hello Stream')
    const app = createSSRApp(App)
    const closeFn = vi.fn()

    await renderToStream(
      app,
      {},
      {
        push() {},
        close: closeFn,
        error() {}
      }
    )

    expect(closeFn).toHaveBeenCalled()
  })

  it('应该处理异步组件', async () => {
    const AsyncComp = createMockAsyncComponent('Async Stream', 10)
    const App = () => h(AsyncComp)
    const app = createSSRApp(App)
    const chunks: string[] = []

    await renderToStream(
      app,
      {},
      {
        push(content) {
          chunks.push(content)
        },
        close() {},
        error(err) {
          throw err
        }
      }
    )

    const html = chunks.join('')
    expect(html).toContain('Async Stream')
  })

  it('应该处理错误', async () => {
    const errorFn = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ErrorComponent = () => {
      throw new Error('Render error')
    }
    const App = () => h(ErrorComponent)
    const app = createSSRApp(App)
    // 渲染阶段发生的错误不会中断渲染，注册app.onError模拟错误处理
    app.config.errorHandler = errorFn
    await renderToStream(
      app,
      {},
      {
        push() {},
        close() {},
        error: errorFn
      }
    )
    consoleError.mockRestore()
    expect(errorFn).toHaveBeenCalled()
  })

  it('应该销毁组件', async () => {
    const fnDestroy = vi.fn()
    const MockFunctionWidget = () => {
      onDispose(fnDestroy)
      return null
    }
    const App = () => h(MockFunctionWidget)
    const app = createSSRApp(App)
    await renderToStream(
      app,
      {},
      {
        push() {},
        close() {},
        error() {}
      }
    )
    expect(fnDestroy).toHaveBeenCalled()
  })
})
