import { getContext, runInContext } from '@vitarx/responsive'

/**
 * 用于存储SSR上下文的唯一Symbol
 */
const RENDER_CONTEXT_SYMBOL = Symbol.for('__v_render_context')

/**
 * 渲染上下文助手
 */
export class RenderContext {
  /** 上下文对象 */
  public readonly ctx: Record<string, any>

  /**
   * 创建渲染上下文
   *
   * @param [ctx] - 上下文对象
   */
  constructor(ctx: Record<string, any> = {}) {
    this.ctx = ctx
  }
  /**
   * 获取缓存数据
   * @param key 缓存键
   * @returns 缓存值，如果不存在则返回undefined
   */
  public getData<T = any>(key: string): T | undefined {
    return this.ctx[key]
  }
  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param value 缓存值
   */
  public setData(key: string, value: any): void {
    this.ctx[key] = value
  }
}
/**
 * 在渲染上下文中执行指定函数
 * @param fn 要在渲染上下文中执行的函数
 * @param ctx 渲染上下文对象，包含渲染所需的各种属性和方法
 * @returns 函数执行的结果
 */
export function runInRenderContext<R>(fn: () => R, ctx?: Record<string, any>) {
  return runInContext(RENDER_CONTEXT_SYMBOL, new RenderContext(ctx), fn)
}

/**
 * 获取当前SSR上下文的Hook函数
 * @returns 当前SSR上下文实例，如果不存在则返回undefined
 */
export function useRenderContext(): RenderContext | undefined {
  return getContext<RenderContext>(RENDER_CONTEXT_SYMBOL)
}
