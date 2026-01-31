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
 * app.mount('#root', window.__INITIAL_STATE__)
 * // 等待应用激活完成
 * // 注意：app.mount 内也是调用的hydrate，因此使用其中一种方式
 * await hydrate(app, '#root', window.__INITIAL_STATE__)
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
  /**
   * 水合激活应用
   *
   * 它和 mount 方法类似，但会返回一个 Promise，表示水合操作的完成。
   *
   * @param container - 可以是HostElements、Element或字符串类型的DOM元素选择器
   * @param SSRContext - 服务端渲染挂载到 window.__INITIAL_STATE__ 上的上下文。
   * @returns {Promise<void>} - 返回一个Promise对象，表示水合操作的完成
   */
  async hydrate(container: HostContainer, SSRContext?: Record<string, any>): Promise<void> {
    // 调用实际的水合函数，将当前实例、容器元素和上下文传递过去
    await hydrate(this, container, SSRContext)
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
  if (__SSR__) {
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
