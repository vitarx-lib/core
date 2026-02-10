import type { RenderContext, ViewRenderer } from '../types/index.js'

let globalRenderer: ViewRenderer
let currentRenderContext: RenderContext | undefined

/**
 * 设置平台渲染适配器
 *
 * @param renderer - 要设置的平台渲染适配器实例，用于处理DOM操作
 */
export function setRenderer(renderer: ViewRenderer): void {
  globalRenderer = renderer
}

/**
 * 获取已注册的HostRenderer实例
 * 如果HostRenderer尚未注册，则会抛出错误
 *
 * @returns {ViewRenderer} 返回已注册的HostRenderer实例
 * @throws {Error} 当HostRenderer未注册时抛出错误
 */
export function getRenderer(): ViewRenderer {
  // 检查globalRenderer是否已定义
  if (globalRenderer) return globalRenderer
  throw new Error('[vitarx][ERROR] Renderer has not been registered.')
}
