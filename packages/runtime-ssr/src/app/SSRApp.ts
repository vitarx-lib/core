import {
  App,
  type HostElements,
  type HostRenderer,
  NodeState,
  setRenderer
} from '@vitarx/runtime-core'
import { DomRenderer } from '@vitarx/runtime-dom'
import { hydrate } from '../client/hydrate.js'
import { __IS_BROWSER__ } from '../shared/constants.js'

if (__IS_BROWSER__) {
  setRenderer(new DomRenderer())
} else {
  setRenderer(
    new Proxy({} as HostRenderer, {
      get(_target: HostRenderer, p: string | symbol, _receiver: any): any {
        return () => {
          throw new Error(`HostRenderer.${p.toString()} is not supported in server side`)
        }
      }
    })
  )
}
interface MountOptions {
  /**
   * SSR上下文
   *
   * 会和 window.__INITIAL_STATE__ 进行合并（如果有）
   */
  context?: Record<string, any>
  /**
   * 是否进行水合（Hydration）
   *
   * @default true
   */
  isHydrate?: boolean
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
 * app.mount('#root', window.__INITIAL_STATE__)
 * // 等待应用激活完成
 * // 注意：app.mount 内也是调用的hydrate，因此使用其中一种方式
 * await hydrate(app, '#root', window.__INITIAL_STATE__)
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
   * @param options
   * @returns {this} 返回当前应用实例，支持链式调用
   */
  override mount(container: HostElements | Element | string, options: MountOptions = {}): this {
    const { isHydrate = true, context } = options
    if (this.rootNode.state === NodeState.Created) {
      if (isHydrate) {
        hydrate(this, container as HostElements, context)
      } else {
        super.mount(container)
      }
      return this
    }
    throw new Error(
      `[Vitarx.createSSRApp][ERROR]: rootNode in (${this.rootNode.state})state cannot be mounted.`
    )
  }
}
