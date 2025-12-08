import type { AppConfig, VNode, WidgetType } from '@vitarx/runtime-core'
import { SSRApp } from './SSRApp.js'

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
export function createSSRApp(root: VNode | WidgetType, config?: AppConfig): SSRApp {
  return new SSRApp(root, config)
}
