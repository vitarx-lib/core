import { useRenderContext, type VNode } from '@vitarx/runtime-core'

/**
 * SSR 渲染模式
 *
 * - `sync`: 同步渲染，等待所有异步任务完成后一次性输出
 * - `stream`: 流式渲染，遇到异步时阻塞等待完成后继续输出，最终内容与 sync 一致
 */
export type SSRRenderMode = 'sync' | 'stream'

/**
 * SSR 内部上下文（框架内部使用）
 */
export interface SSRInternalContext {
  /**
   * 节点异步任务映射
   * 将异步任务绑定到对应的节点，服务端和客户端统一使用
   */
  $nodeAsyncMap?: WeakMap<VNode, Promise<unknown>>
  /**
   * 是否处于水合阶段
   */
  $isHydrating?: boolean
}

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
export type SSRContext<T = Record<string, any>> = T & Partial<SSRInternalContext>

/**
 * 获取 SSR 上下文
 *
 * 在组件中调用此函数可以访问服务端渲染时的上下文数据，
 * 可用于在服务端写入状态，客户端恢复状态。
 *
 * @returns SSR上下文对象，如果不在SSR环境中则返回undefined
 *
 * @example
 * ```ts
 * function MyComponent() {
 *   const ctx = useSSRContext()
 *   if (ctx) {
 *     // 服务端渲染时写入数据
 *     ctx.myData = fetchedData
 *   }
 *   // ...
 * }
 * ```
 */
export function useSSRContext<T = Record<string, any>>(): SSRContext<T> | undefined {
  return useRenderContext<SSRContext<T>>()
}

/**
 * 检查当前是否在 SSR 环境中
 *
 * @returns 如果在SSR环境中返回true，否则返回false
 *
 * @example
 * ```ts
 * if (isSSR()) {
 *   // 服务端特定逻辑
 * }
 * ```
 */
export function isSSR(): boolean {
  const ctx = useSSRContext()
  return ctx !== undefined && ctx.$renderMode !== undefined
}

/**
 * 检查当前是否在水合阶段
 *
 * @returns 如果在水合阶段返回true，否则返回false
 */
export function isHydrating(): boolean {
  return useSSRContext()?.$isHydrating === true
}

/**
 * 获取当前 SSR 渲染模式
 *
 * @returns 渲染模式，如果不在SSR环境中返回undefined
 */
export function getSSRRenderMode(): SSRRenderMode | undefined {
  return useSSRContext()?.$renderMode
}
