import { App, type AppConfig, type Component, setRenderer, type View } from '@vitarx/runtime-core'
import { DOMRenderer } from './renderer.js'

/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetType)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: View | Component, config?: AppConfig): App {
  setRenderer(new DOMRenderer())
  return new App(root, config)
}
