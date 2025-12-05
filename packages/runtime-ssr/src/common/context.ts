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
export type SSRContext = Record<string, any>
