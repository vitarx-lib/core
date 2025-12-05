import {
  type NodeDriver,
  type NodeType,
  renderNode,
  runInRenderContext,
  setDefaultDriver,
  type VNode
} from '@vitarx/runtime-core'
import type { SSRApp } from '../../app/SSRApp.js'
import {
  ASYNC_TASKS_KEY,
  serializeVNodeToSink,
  type SSRContext,
  StringSink
} from '../../shared/index.js'
import { SSRRenderDriver } from '../drivers/index.js'

/**
 * 将应用渲染为 HTML 字符串
 *
 * 等待所有异步任务完成后，一次性序列化整个虚拟节点树。
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象，用于服务端记录状态、客户端水合恢复
 * @returns HTML 字符串
 *
 * @example
 * ```ts
 * const context: SSRContext = {}
 * const html = await renderToString(app, context)
 * ```
 */
export async function renderToString(
  root: SSRApp | VNode,
  context: SSRContext = {}
): Promise<string> {
  // 注册服务器端驱动
  setDefaultDriver(new SSRRenderDriver() as unknown as NodeDriver<NodeType>)
  // 设置渲染模式为同步
  context.$renderMode = 'sync'
  const asyncTasks: Promise<unknown>[] = []
  // 初始化上下文中的异步任务队列
  context[ASYNC_TASKS_KEY] = asyncTasks

  return await runInRenderContext(async () => {
    // 解析根节点
    const rootNode: VNode =
      typeof (root as VNode)?.kind === 'number' ? (root as VNode) : (root as SSRApp).rootNode

    // 1) 渲染根节点（仅构建，不输出）
    renderNode(rootNode)

    // 2) 消费所有异步任务（来自驱动/组件的解析）
    let task = asyncTasks.pop()
    while (task) {
      await task
      task = asyncTasks.pop()
    }

    // 3) 一次性序列化主树到 sink
    const sink = new StringSink()
    serializeVNodeToSink(rootNode, sink)
    // 删除异步任务队列
    delete context[ASYNC_TASKS_KEY]
    // 4) 返回 HTML 字符串
    return sink.toString()
  }, context)
}
