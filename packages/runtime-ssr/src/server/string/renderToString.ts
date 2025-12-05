import { renderNode, runInRenderContext, setDefaultDriver, type VNode } from '@vitarx/runtime-core'
import type { SSRApp } from '../../app/SSRApp.js'
import { serializeVNodeToSink, type SSRContext, StringSink } from '../../shared/index.js'
import { SSRRenderDriver } from '../drivers/index.js'

/**
 * 将应用渲染为 HTML 字符串（同步模式）
 *
 * 等待所有异步任务完成后，一次性序列化整个虚拟节点树。
 * 输出内容包含完整的异步组件渲染结果，水合逻辑与 block 模式一致。
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
  root: SSRApp | VNode,
  context: SSRContext = {}
): Promise<string> {
  // 注册服务器端驱动
  setDefaultDriver(new SSRRenderDriver())

  // 设置渲染模式为同步
  context.$renderMode = 'sync'
  // 初始化异步任务队列
  context.$asyncTasks = []

  return await runInRenderContext(async () => {
    // 解析根节点
    const rootNode: VNode =
      typeof (root as VNode)?.kind === 'number' ? (root as VNode) : (root as SSRApp).rootNode

    // 1) 渲染根节点（仅构建，不输出）
    renderNode(rootNode)

    // 2) 消费所有异步任务（来自驱动/组件的解析）
    const asyncTasks = context.$asyncTasks!
    while (asyncTasks.length > 0) {
      const task = asyncTasks.pop()
      if (task) await task
    }

    // 3) 一次性序列化主树到 sink
    const sink = new StringSink()
    serializeVNodeToSink(rootNode, sink)

    // 4) 清理内部状态
    delete context.$asyncTasks

    // 5) 返回 HTML 字符串
    return sink.toString()
  }, context)
}
