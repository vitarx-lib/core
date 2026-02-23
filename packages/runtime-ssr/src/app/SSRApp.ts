import {
  type AppConfig,
  type Component,
  type HostContainer,
  setRenderer,
  type View,
  type ViewRenderer
} from '@vitarx/runtime-core'
import { DOMRenderer, WebApp } from '@vitarx/runtime-dom'
import { hydrate } from '../client/hydrate.js'

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
 * app.mount('#root')
 * ```
 */
export class SSRApp extends WebApp {
  /**
   * 挂载应用到容器
   *
   * 在客户端环境中会自动检测容器是否包含 SSR 渲染的内容：
   * - 如果有 SSR 内容，则进行水合（hydration），复用已有 DOM
   * - 如果没有 SSR 内容，则进行正常的客户端渲染
   *
   * @param container - 挂载容器，可以是 DOM 元素或选择器字符串
   * @param SSRContext - SSR上下文
   * @returns {this} 返回当前应用实例，支持链式调用
   */
  override mount(container: HostContainer | string, SSRContext?: Record<string, any>): this {
    hydrate(this, container, SSRContext)
    return this
  }
}

/**
 * 创建 SSR 应用实例
 *
 * @param root - 根组件或虚拟节点
 * @param config - 应用配置
 * @returns SSR 应用实例
 *
 * @example
 * ```ts
 * const app = createSSRApp(App)
 * const html = await renderToString(app)
 * ```
 */
export function createSSRApp(root: View | Component, config?: AppConfig): SSRApp {
  if (__VITARX_SSR__) {
    setRenderer(
      new Proxy({} as ViewRenderer, {
        get(_target: ViewRenderer, p: string | symbol, _receiver: any): any {
          return () => {
            throw new Error(`ViewRenderer.${p.toString()} is not supported in server side`)
          }
        }
      })
    )
  } else {
    setRenderer(new DOMRenderer())
  }
  return new SSRApp(root, config)
}
