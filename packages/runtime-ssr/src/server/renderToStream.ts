import {
  isVNode,
  renderNode,
  runInRenderContext,
  setDefaultDriver,
  type VNode
} from '@vitarx/runtime-core'
import { SSRApp } from '../app/index.js'
import type { NodeAsyncMap } from '../shared/context.js'
import { type SSRContext } from '../shared/index.js'
import { streamSerializeNode } from '../shared/serialize.js'
import type { StreamingSink } from '../shared/sink.js'
import { SSRRenderDriver } from './SSRRenderDriver.js'

/**
 * 将应用渲染为流（block 模式）
 *
 * 流式渲染，逐步输出 HTML 内容，遇到异步任务时阻塞等待完成。
 * 最终输出内容与 sync 模式一致，水合逻辑也一致。
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象
 * @param options - 流式渲染选项
 *
 * @example
 * ```ts
 * const context: SSRContext = {}
 * renderToStream(app, context, {
 *   push(content) { res.write(content) },
 *   close() { res.end() },
 *   error(err) { console.error(err) }
 * })
 * ```
 */
export async function renderToStream(
  root: SSRApp | VNode,
  context: SSRContext = {},
  options: StreamingSink
): Promise<void> {
  // 注册服务器端驱动
  setDefaultDriver(new SSRRenderDriver())

  // 初始化节点异步任务映射
  const nodeAsyncMap: NodeAsyncMap = new WeakMap()
  context.$nodeAsyncMap = nodeAsyncMap

  try {
    await runInRenderContext(async () => {
      const rootNode: VNode = isVNode(root) ? root : root.rootNode

      // 渲染根节点（构建虚拟节点树，异步任务绑定到节点）
      renderNode(rootNode)

      // 流式输出（逐个节点序列化，遇到异步则等待）
      await streamSerializeNode(rootNode, options, nodeAsyncMap)

      // 清理内部状态
      delete context.$nodeAsyncMap
      options.close()
    }, context)
  } catch (err) {
    options.error(err)
  }
}

/**
 * 创建 Web Streams API 的 ReadableStream
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象
 * @returns ReadableStream<string>
 *
 * @example
 * ```ts
 * const stream = renderToReadableStream(app, context)
 * return new Response(stream)
 * ```
 */
export function renderToReadableStream(
  root: SSRApp | VNode,
  context: SSRContext = {}
): ReadableStream<string> {
  let controller: ReadableStreamDefaultController<string>

  const stream = new ReadableStream<string>({
    start(c) {
      controller = c
    }
  })

  renderToStream(root, context, {
    push(content) {
      controller.enqueue(content)
    },
    close() {
      controller.close()
    },
    error(err) {
      controller.error(err)
    }
  })

  return stream
}

/**
 * 创建 Node.js 的 Readable 流
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param context - SSR 上下文对象
 * @returns Promise 解析为一个 Readable 流
 *
 * @example
 * ```ts
 * const stream = await renderToNodeStream(app, context)
 * stream.pipe(res)
 * ```
 */
export async function renderToNodeStream(
  root: SSRApp | VNode,
  context: SSRContext = {}
): Promise<NodeJS.ReadableStream> {
  const { Readable } = await import('stream')
  const chunks: string[] = []
  let resolveStream: (stream: NodeJS.ReadableStream) => void
  let rejectStream: (err: unknown) => void

  const promise = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    resolveStream = resolve
    rejectStream = reject
  })

  await renderToStream(root, context, {
    push(content) {
      chunks.push(content)
    },
    close() {
      const stream = Readable.from(chunks)
      resolveStream(stream)
    },
    error(err) {
      rejectStream(err)
    }
  })

  return promise
}

/**
 * 管道到 Node.js Writable 流
 *
 * @param root - SSR 应用实例或虚拟节点
 * @param writable - Node.js Writable 流
 * @param context - SSR 上下文对象
 *
 * @example
 * ```ts
 * await pipeToWritable(app, res, context)
 * ```
 */
export async function pipeToWritable(
  root: SSRApp | VNode,
  writable: NodeJS.WritableStream,
  context: SSRContext = {}
): Promise<void> {
  return await renderToStream(root, context, {
    push(content) {
      writable.write(content)
    },
    close() {
      writable.end()
    },
    error(err) {
      // Node.js WritableStream may not have destroy method in all environments
      if ('destroy' in writable && typeof writable.destroy === 'function') {
        ;(writable as any).destroy(err)
      } else {
        writable.end()
      }
    }
  })
}
