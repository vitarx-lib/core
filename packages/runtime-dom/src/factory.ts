import {
  App,
  type AppConfig,
  hasNodeDriver,
  hasRenderer,
  setRenderer,
  type VNode,
  type WidgetType
} from '@vitarx/runtime-core'
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'
import { DomRenderer } from './DomRenderer.js'

/**
 * 设置运行时环境
 *
 * 该函数用于初始化和配置运行时所需的各种设置
 * 包括渲染器和驱动器的配置
 *
 * 无需额外调用，除非你在createApp之前需要操作渲染节点。
 */
export function setupRuntime() {
  if (!hasRenderer()) {
    // 设置运行时渲染器，使用DOM渲染器
    setRenderer(new DomRenderer())
  }
  if (!hasNodeDriver()) {
    // 使用默认驱动器
    registerDefaultDrivers()
  }
}

/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetType)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: VNode | WidgetType, config?: AppConfig): App {
  setupRuntime()
  return new App(root, config)
}
