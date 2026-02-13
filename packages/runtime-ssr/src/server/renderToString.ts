import { isView, RENDER_CONTEXT, type View } from '@vitarx/runtime-core'
import { SSRApp } from '../app/index.js'
import { type SSRContext } from '../shared/index.js'
import { serializeViewToSink } from '../shared/serialize.js'
import { StringSink } from '../shared/sink.js'

/**
 * 将应用渲染为 HTML 字符串（同步模式）
 *
 * 等待所有异步任务完成后，一次性序列化整个虚拟节点树。
 * 输出内容包含完整的异步组件渲染结果，水合逻辑与 stream 模式一致。
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象，用于服务端记录状态、客户端水合恢复
 * @returns HTML 字符串
 *
 * @example
 * ```ts
 * const context: SSRContext = {}
 * const html = await renderToString(app, context)
 * // context 中包含渲染过程中写入的状态
 * ```
 */
export async function renderToString(
  root: SSRApp | View,
  context: SSRContext = {}
): Promise<string> {
  const isApp = !isView(root)
  if (isApp) root.inject(RENDER_CONTEXT, context)
  const rootView: View = isApp ? root.rootView : root
  // 渲染根节点（构建虚拟节点树，异步任务绑定到节点）
  rootView.init(isApp ? { app: root } : undefined)
  // 一次性序列化主树到 sink
  const sink = new StringSink()
  await serializeViewToSink(rootView, sink)
  // 5) 返回 HTML 字符串
  return sink.toString()
}
