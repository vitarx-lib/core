import {
  App,
  type AppConfig,
  type Component,
  type HostContainer,
  setRenderer,
  type View
} from '@vitarx/runtime-core'
import { DOMRenderer } from './renderer.js'

/**
 * WebApp 是一个用于将应用挂载到 Web 环境中的类，继承自 App 类。
 *
 * 核心功能：
 * - 支持通过 DOM 元素或选择器字符串将应用挂载到指定的容器中
 * - 自动处理选择器字符串到 DOM 元素的转换
 * - 提供错误处理机制，当指定的选择器无法找到对应元素时抛出错误
 *
 * 使用示例：
 * ```typescript
 * const app = new WebApp();
 * // 通过选择器字符串挂载
 * app.mount('#app-container');
 * // 或直接通过 DOM 元素挂载
 * app.mount(document.querySelector('#app-container'));
 * ```
 *
 * 构造函数参数：
 * 无（继承自父类 App）
 *
 * 特殊限制：
 * - 当传入选择器字符串时，必须确保该选择器能匹配到页面中存在的 DOM 元素
 * - 如果选择器无法匹配到元素，会抛出 Error 异常
 *
 * 潜在副作用：
 * - 会修改指定的 DOM 容器内容
 * - 当选择器无效时会中断程序执行
 */
export class WebApp extends App {
  override mount(container: HostContainer | Element | string): this {
    // 如果传入的是字符串，则通过querySelector获取对应的DOM元素
    if (typeof container === 'string') {
      container = document.querySelector(container)!
      // 如果找不到对应的DOM元素，抛出错误
      if (!container) {
        throw new Error(
          `[WebApp.mount][ERROR]: The element corresponding to the specified selector ${container} was not found.`
        )
      }
    }
    if (container instanceof Element) {
      return super.mount(container)
    }
    throw new Error(
      `[WebApp.mount][ERROR]: container parameter must be an Element instance or selector`
    )
  }
}

/**
 * 创建一个新的应用实例
 *
 * @param root - 应用的根节点，可以是虚拟节点(VNode)或小部件类型(WidgetType)
 * @param config - 可选的应用配置参数，用于定制应用的行为
 * @returns {App} 返回一个新的App实例
 */
export function createApp(root: View | Component, config?: AppConfig): WebApp {
  setRenderer(new DOMRenderer())
  return new WebApp(root, config)
}
