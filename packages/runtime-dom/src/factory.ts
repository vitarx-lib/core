import {
  App,
  type AppConfig,
  setRenderer,
  type VNode,
  type WidgetTypes
} from '@vitarx/runtime-core'
import { setupDefaultDrivers } from '@vitarx/runtime-drivers'
import { DomRenderer } from './DomRenderer.js'

// 设置运行时渲染器，使用DOM渲染器
setRenderer(new DomRenderer())
// 使用默认驱动器
setupDefaultDrivers()
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
