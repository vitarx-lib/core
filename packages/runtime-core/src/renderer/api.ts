import type { HostRenderer } from '../types/index.js'

let globalRenderer: HostRenderer

/**
 * 设置平台渲染适配器
 *
 * @param hostRenderer - 要设置的平台渲染适配器实例，用于处理DOM操作
 */
export function setRenderer(hostRenderer: HostRenderer) {
  globalRenderer = hostRenderer
}

/**
 * 获取已注册的HostRenderer实例
 * 如果HostRenderer尚未注册，则会抛出错误
 *
 * @returns {HostRenderer} 返回已注册的HostRenderer实例
 * @throws {Error} 当HostRenderer未注册时抛出错误
 */
export function getRenderer(): HostRenderer {
  // 检查globalRenderer是否已定义
  if (globalRenderer) return globalRenderer
  throw new Error('[vitarx][ERROR] Renderer has not been registered.')
}

/**
 * 检查是否存在渲染器实例
 * 该函数用于判断全局渲染器对象 globalRenderer 是否已初始化
 * @returns {boolean} - 如果 globalRenderer 存在则返回 true，否则返回 false
 */
export function hasRenderer(): boolean {
  return !!globalRenderer
}
