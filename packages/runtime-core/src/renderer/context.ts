import { getContext, runInContext } from '@vitarx/responsive'
import type { RenderContext } from '../types/index.js'

/**
 * 用于存储渲染上下文的唯一Symbol
 */
const RENDER_CONTEXT_SYMBOL = Symbol.for('__v_render_context')
/**
 * 在渲染上下文中执行指定函数
 *
 * @param fn 要在渲染上下文中执行的函数
 * @param ctx 渲染上下文对象，包含渲染所需的各种属性和方法
 * @returns 函数执行的结果
 */
export function runInRenderContext<R>(fn: () => R, ctx: RenderContext = {}) {
  return runInContext(RENDER_CONTEXT_SYMBOL, ctx, fn)
}
/**
 * 获取当前渲染上下文
 *
 * @alias getRenderContext
 * @returns {object|undefined} 当前上下文对象，如果不存在则返回undefined
 */
export function useRenderContext<T extends RenderContext = RenderContext>(): T | undefined {
  return getContext<T>(RENDER_CONTEXT_SYMBOL)
}

export { useRenderContext as getRenderContext }
