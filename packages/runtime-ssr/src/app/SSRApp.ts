import { App, type HostParentElement, type HostRenderer, setRenderer } from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom'
import { hydrate } from '../client/hydrate.js'
import type { SSRContext } from '../shared/context.js'
import { __IS_SERVER__ } from '../shared/index.js'

if (__IS_SERVER__) {
  setRenderer(
    new Proxy({} as HostRenderer, {
      get(_target: HostRenderer, p: string | symbol, _receiver: any): any {
        return () => {
          throw new Error(`HostRenderer.${p.toString()} is not supported in server side`)
        }
      }
    })
  )
} else {
  setRenderer(new DomRenderer())
}

/**
 * SSR 应用类
 *
 * 继承自 App，用于服务端渲染和客户端水合场景。
 *
 * 核心特性：
 * - 服务端：通过 renderToString/renderToStream 渲染为 HTML 字符串
 * - 客户端：mount 时自动检测是否需要水合，复用服务端渲染的 DOM
 *
 * @example
 * ```ts
 * // 服务端
 * const app = createSSRApp(App)
 * const html = await renderToString(app, context)
 *
 * // 客户端
 * const app = createSSRApp(App)
 * app.mount('#app', window.__SSR_CONTEXT__)
 * ```
 */
export class SSRApp extends App {
  /**
   * 挂载应用到容器
   *
   * 在客户端环境中会自动检测容器是否包含 SSR 渲染的内容：
   * - 如果有 SSR 内容，则进行水合（hydration），复用已有 DOM
   * - 如果没有 SSR 内容，则进行正常的客户端渲染
   *
   * @param container - 挂载容器，可以是 DOM 元素或选择器字符串
   * @param context - SSR 上下文对象，可选
   * @returns {this} 返回当前应用实例，支持链式调用
   */
  override mount(container: HostParentElement | string, context?: SSRContext): this {
    // 服务端不执行挂载
    if (__IS_SERVER__) {
      throw new Error('[SSRApp.mount] Cannot mount in server environment')
    }

    // 解析容器
    const containerEl =
      typeof container === 'string' ? document.querySelector(container) : container

    if (!containerEl) {
      throw new Error(`[SSRApp.mount] Container not found: ${container}`)
    }

    // 检测是否需要水合
    if (containerEl.childNodes.length > 0) {
      // 执行水合
      hydrate(this, containerEl, context).catch(err => {
        console.error('[SSRApp.mount] Hydration failed:', err)
        // 水合失败后尝试正常挂载
        super.mount(container)
      })
    } else {
      // 正常客户端渲染
      super.mount(container)
    }

    return this
  }
}
