import { App, type AppConfig, setRenderer, type VNode, type WidgetType } from '@vitarx/runtime-core'
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'
import { DomRenderer } from './DomRenderer.js'

/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetType)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: VNode | WidgetType, config?: AppConfig): App {
  // 设置运行时渲染器，使用DOM渲染器
  setRenderer(new DomRenderer())
  // 使用默认驱动器
  registerDefaultDrivers()
  return new App(root, config)
}
