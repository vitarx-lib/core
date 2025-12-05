import { type VNode } from '@vitarx/runtime-core'
import type { SSRApp } from '../../app/SSRApp.js'
import { type SSRContext } from '../../shared/index.js'

/**
 * 流式渲染异步策略
 */
export type StreamAsyncStrategy = 'block' | 'ignore'

/**
 * 流式渲染选项
 */
export interface StreamRenderOptions {
  mode?: StreamAsyncStrategy
  /**
   * 将内容推送到流
   * @param content - 要推送的内容
   */
  push(content: string): void
  /**
   * 关闭流
   */
  close(): void
  /**
   * 发送错误到流
   * @param error - 错误对象
   */
  error(error: Error): void
}

/**
 * 将应用渲染为 Web Streams API 的 ReadableStream
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象
 * @param options - 流式渲染选项
 * @returns ReadableStream<string>
 *
 * @example
 * ```ts
 * // 基本用法
 * const stream = renderToStream(app)
 *
 * // 阻塞模式（等待所有异步完成）
 * const stream = renderToStream(app, {}, { asyncStrategy: 'block' })
 *
 * // 忽略模式（立即输出，异步内容输出占位符）
 * const stream = renderToStream(app, {}, { asyncStrategy: 'ignore' })
 * ```
 */
export function renderToStream(
  root: SSRApp | VNode,
  context: SSRContext = {},
  options: StreamRenderOptions
) {}

export async function renderToSimpleStream(
  root: SSRApp | VNode,
  context: Record<string, any>,
  options: StreamRenderOptions
) {}
