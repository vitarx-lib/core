import type { AppConfig, VNode, WidgetTypes } from '@vitarx/runtime-core'
import { setHostSchema } from '@vitarx/runtime-core'
import { VOID_ELEMENTS } from '@vitarx/runtime-dom/renderer'
import { SSRApp } from './SSRApp.js'

// Setup host schema for void elements
setHostSchema({ voidElements: VOID_ELEMENTS })

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
export function createSSRApp(root: VNode | WidgetTypes, config?: AppConfig): SSRApp {
  return new SSRApp(root, config)
}
