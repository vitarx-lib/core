import type { AppConfig, VNode, WidgetTypes } from '@vitarx/runtime-core'
import { setHostSchema } from '@vitarx/runtime-core'
import { VOID_ELEMENTS } from '@vitarx/runtime-dom/renderer'
import { SSRApp } from './SSRApp.js'
// Setup host schema for void elements
setHostSchema({ voidElements: VOID_ELEMENTS })
/**
 * Create SSR app instance
 *
 * @param root - Root widget or VNode
 * @param config - App configuration
 * @returns SSR app instance
 */
export function createSSRApp(root: VNode | WidgetTypes, config?: AppConfig): SSRApp {
  // Create and return SSR app
  return new SSRApp(root, config)
}
