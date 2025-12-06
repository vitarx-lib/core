import {
  isContainerNode,
  isWidgetNode,
  renderNode,
  runInRenderContext,
  setDefaultDriver,
  type VNode
} from '@vitarx/runtime-core'
import { SSRApp } from '../app/index.js'
import { serializeVNodeToSink, type SSRContext, StringSink } from '../shared/index.js'
import { SSRRenderDriver } from './SSRRenderDriver.js'

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
  root: SSRApp | VNode,
  context: SSRContext = {}
): Promise<string> {
  // 注册服务器端驱动
  setDefaultDriver(new SSRRenderDriver())

  // 设置渲染模式为同步
  context.$renderMode = 'sync'
  // 初始化节点异步任务映射
  const nodeAsyncMap = new WeakMap<VNode, Promise<unknown>>()
  context.$nodeAsyncMap = nodeAsyncMap
  return await runInRenderContext(async () => {
    // 解析根节点
    const rootNode: VNode =
      typeof (root as VNode)?.kind === 'number' ? (root as VNode) : (root as SSRApp).rootNode

    // 1) 渲染根节点（仅构建，不输出）
    renderNode(rootNode)

    // 2) 等待所有异步任务完成（遍历 WeakMap 中的任务）
    await waitAllAsyncTasks(rootNode, nodeAsyncMap)

    // 3) 一次性序列化主树到 sink
    const sink = new StringSink()
    serializeVNodeToSink(rootNode, sink)

    // 4) 清理内部状态
    delete context.$nodeAsyncMap

    // 5) 返回 HTML 字符串
    return sink.toString()
  }, context)
}

/**
 * 等待所有异步任务完成
 * 遍历节点树，检查每个节点是否有异步任务，如果有则等待
 */
async function waitAllAsyncTasks(
  node: VNode,
  nodeAsyncMap: WeakMap<VNode, Promise<unknown>>
): Promise<void> {
  // 检查当前节点是否有异步任务
  const asyncTask = nodeAsyncMap.get(node)
  if (asyncTask) {
    await asyncTask
    nodeAsyncMap.delete(node)
  }

  // 遍历子节点
  if (isContainerNode(node)) {
    for (const child of node.children) {
      await waitAllAsyncTasks(child, nodeAsyncMap)
    }
  }

  // 处理 Widget 的 child
  if (isWidgetNode(node)) {
    await waitAllAsyncTasks(node.instance!.child, nodeAsyncMap)
  }
}
