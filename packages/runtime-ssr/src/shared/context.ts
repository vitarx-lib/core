import { useRenderContext } from '@vitarx/runtime-core'

/**
 * SSR 用户上下文类型
 *
 * 开发者可在服务端渲染时写入任意状态，客户端通过 runInRenderContext 恢复。
 * 与 Vue 的 SSRContext 设计一致，用于在服务端记录状态、客户端水合恢复。
 *
 * @example
 * ```ts
 * // 服务端
 * const context: SSRContext = {}
 * const html = await renderToString(app, context)
 * // context 中会包含渲染过程中写入的状态
 *
 * // 客户端
 * runInRenderContext(() => hydrate(...), serverContext)
 * ```
 */
interface SSRContext {
  /**
   * 渲染模式
   */
  $renderMode: 'block' | 'ignore' | 'sync'
  [key: string]: any
}

/**
 * 获取SSR(服务器端渲染)上下文的函数
 * 这个函数允许在组件中访问服务器端渲染时的上下文数据
 *
 * @returns {SSRContext | undefined} - 返回SSR上下文对象，如果不在SSR环境中则返回undefined
 */
export function useSSRContext<T = Record<string, any>>(): (T & SSRContext) | undefined {
  // 调用useRenderContext函数，指定泛型类型为SSRContext
  // 这样可以获取到专门用于服务器端渲染的上下文数据
  return useRenderContext<T & SSRContext>()
}
