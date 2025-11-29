import { App, type AppConfig, type VNode, type WidgetTypes } from '@vitarx/runtime-core'
import { createRenderer } from './DomRenderer.js'

// 自动创建渲染器
createRenderer()

/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetTypes)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: VNode | WidgetTypes, config?: AppConfig): App {
  return new App(root, config)
}
