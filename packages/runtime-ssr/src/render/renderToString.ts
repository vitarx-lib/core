import { renderNode, runInRenderContext, type VNode } from '@vitarx/runtime-core'
import type { SSRContext } from '../common/context.js'
import { setupServerDrivers } from '../server/setup.js'
import type { SSRApp } from '../SSRApp.js'
import { StringSink } from '../string/StringSink.js'
import { serializeVNodeToSink } from './serialize.js'

/**
 * SSR 渲染选项
 */
export interface RenderOptions {
  /**
   * 是否注入用于水合的初始状态
   * @default false
   */
  injectState?: boolean

  /**
   * 是否注入水合脚本
   * @default false
   */
  injectHydrationScript?: boolean

  /**
   * 用于水合的状态变量名
   * @default "VITARX_STATE"
   */
  stateVariableName?: string
}

/**
 * 将应用渲染为 HTML 字符串
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象，用于服务端记录状态、客户端水合恢复
 * @returns HTML 字符串
 */
export async function renderToString(
  root: SSRApp | VNode,
  context: SSRContext = {}
): Promise<string> {
  // 注册服务器端驱动
  setupServerDrivers()
  // 初始化上下文中的异步任务队列（框架内部保留字段）
  if (!Array.isArray((context as any).__asyncTasks)) {
    ;(context as any).__asyncTasks = []
  }
  const asyncTasks = (context as any).__asyncTasks as Promise<unknown>[]

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
    const sink = new StringSink()

    // 3) 一次性序列化主树到 sink
    serializeVNodeToSink(rootNode, new StringSink())

    // 4) 获取 HTML 字符串并按需注入
    return sink.toString()
  }, context)
}
