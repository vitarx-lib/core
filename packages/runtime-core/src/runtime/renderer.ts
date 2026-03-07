import type { ViewRenderer } from '../types/index.js'

let globalRenderer: ViewRenderer

/**
 * 设置平台渲染适配器
 *
 * @param renderer - 要设置的平台渲染适配器实例，用于处理DOM操作
 */
export function setRenderer(renderer: ViewRenderer): void {
  globalRenderer = renderer
}

/**
 * 获取注册的 ViewRenderer 实例
 * 如果尚未注册，则会抛出错误
 *
 * @returns {ViewRenderer} 返回已注册的ViewRenderer实例
 * @throws {Error} 未注册时抛出错误
 */
export function getRenderer(): ViewRenderer
/**
 * 获取注册的 ViewRenderer 实例
 * 如果尚未注册，则会抛出错误
 *
 * @param {boolean} allowEmpty - 不允许返回null
 * @returns {ViewRenderer} 返回已注册的ViewRenderer实例
 * @throws {Error} 未注册时抛出错误
 */
export function getRenderer(allowEmpty: false): ViewRenderer
/**
 * 获取注册的 ViewRenderer 实例
 *
 * @param {boolean} allowEmpty - 允许返回null
 * @returns {ViewRenderer | null } 返回已注册的ViewRenderer实例或null
 */
export function getRenderer(allowEmpty: true): ViewRenderer | null
/**
 * 获取渲染器实例的函数
 *
 * @param allowEmpty - 是否允许返回空渲染器，默认为false
 * @returns - 返回ViewRenderer类型的渲染器实例，如果allowEmpty为true且未注册渲染器则返回null
 * @throws {Error} 如果allowEmpty为false且未注册渲染器，则抛出错误
 */
export function getRenderer(allowEmpty: boolean = false): ViewRenderer | null {
  if (globalRenderer) return globalRenderer
  if (allowEmpty) return null
  throw new Error('[getRenderer] Renderer has not been registered')
}
