import { h } from '@vitarx/runtime-core'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, renderToStream } from '../../src/index.js'
import { createMockAsyncComponent } from '../helpers.js'

describe('renderToStream', () => {
  it('should stream HTML content', async () => {
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

  it('should call close after rendering', async () => {
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

  it('should handle async components', async () => {
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

  it('should handle errors', async () => {
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
})
