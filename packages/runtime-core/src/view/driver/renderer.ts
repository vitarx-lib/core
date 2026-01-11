import type { HostRenderer, RenderContext } from '../../types/index.js'

let Renderer: HostRenderer
let currentRenderContext: RenderContext | undefined

/**
 * 设置平台渲染适配器
 *
 * @param renderer - 要设置的平台渲染适配器实例，用于处理DOM操作
 */
export function setRenderer(renderer: HostRenderer) {
  Renderer = renderer
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
  if (Renderer) return Renderer
  throw new Error('[vitarx][ERROR] Renderer has not been registered.')
}

/**
 * 在渲染上下文中执行指定函数
 *
 * @param fn 要在渲染上下文中执行的函数
 * @param ctx 渲染上下文对象，包含渲染所需的各种属性和方法
 * @returns 函数执行的结果
 */
export function withRenderContext<R>(fn: () => R, ctx: RenderContext = {}): R {
  const preCtx = currentRenderContext
  try {
    currentRenderContext = ctx
    return fn()
  } finally {
    currentRenderContext = preCtx
  }
}

/**
 * 获取当前渲染上下文
 *
 * @alias getRenderContext
 * @returns {object|undefined} 当前上下文对象，如果不存在则返回undefined
 */
export function getRenderContext<T extends RenderContext = RenderContext>(): T | undefined {
  return currentRenderContext as T | undefined
}
