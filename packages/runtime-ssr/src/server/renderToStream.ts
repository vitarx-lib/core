import {
  NodeKind,
  renderNode,
  runInRenderContext,
  setDefaultDriver,
  StyleUtils,
  type VNode,
  type WidgetNode,
  withDirectives
} from '@vitarx/runtime-core'
import { SSRApp } from '../app/index.js'
import {
  escapeHTML,
  type Sink,
  type SSRContext,
  tagClose,
  tagOpen,
  tagSelfClosing
} from '../shared/index.js'
import { SSRRenderDriver } from './SSRRenderDriver.js'

// 节点异步任务映射类型
type NodeAsyncMap = WeakMap<VNode, Promise<unknown>>

/**
 * 流式渲染选项
 */
export interface StreamRenderOptions {
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
 * 内部流式 Sink 实现
 */
class StreamingSink implements Sink {
  constructor(private options: StreamRenderOptions) {}

  push(content: string): void {
    this.options.push(content)
  }
}

/**
 * 流式序列化节点（渐进式渲染）
 *
 * 递归渲染节点树，遇到有异步任务的节点时阻塞等待其完成后再继续。
 */
async function streamSerializeNode(
  node: VNode,
  sink: StreamingSink,
  nodeAsyncMap: NodeAsyncMap
): Promise<void> {
  switch (node.kind) {
    case NodeKind.REGULAR_ELEMENT: {
      const { type: tagName, props, children } = node as any
      if (node.directives?.get('show')) {
        const show = node.directives.get('show')![1]
        if (!show) props.style = StyleUtils.mergeCssStyle(props.style || {}, { display: 'none' })
      }
      sink.push(tagOpen(tagName, props))

      if (props['v-html']) {
        sink.push(String(props['v-html']))
      } else {
        for (let i = 0; i < children.length; i++) {
          await streamSerializeNode(children[i], sink, nodeAsyncMap)
        }
      }

      sink.push(tagClose(tagName))
      break
    }
    case NodeKind.VOID_ELEMENT: {
      const { type: tagName, props } = node as any
      if (node.directives?.get('show')) {
        const show = node.directives.get('show')![1]
        if (!show) props.style = StyleUtils.mergeCssStyle(props.style || {}, { display: 'none' })
      }
      sink.push(tagSelfClosing(tagName, props))
      break
    }
    case NodeKind.TEXT:
      sink.push(escapeHTML((node as any).props.text))
      break
    case NodeKind.COMMENT:
      sink.push(`<!--${(node as any).props.text}-->`)
      break
    case NodeKind.FRAGMENT: {
      sink.push('<!--Fragment start-->')
      const { children } = node as any
      for (let i = 0; i < children.length; i++) {
        await streamSerializeNode(children[i], sink, nodeAsyncMap)
      }
      sink.push('<!--Fragment end-->')
      break
    }
    case NodeKind.STATELESS_WIDGET:
    case NodeKind.STATEFUL_WIDGET: {
      // 检查该节点是否有绑定的异步任务，有则等待其完成
      const pendingTask = nodeAsyncMap.get(node)
      if (pendingTask) {
        await pendingTask
        nodeAsyncMap.delete(node)
      }
      // 异步完成后继续序列化 child
      const child = (node as WidgetNode).instance?.child!
      // 父组件的 show 指令会应用到子组件上
      if (node.directives?.get('show') && !child.directives?.get('show')) {
        withDirectives(child, [node.directives?.get('show')!])
      }
      await streamSerializeNode(child, sink, nodeAsyncMap)
      break
    }
  }
}

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
  options: StreamRenderOptions
): Promise<void> {
  // 注册服务器端驱动
  setDefaultDriver(new SSRRenderDriver())

  // 设置渲染模式为流式
  context.$renderMode = 'stream'
  // 初始化节点异步任务映射
  const nodeAsyncMap: NodeAsyncMap = new WeakMap()
  context.$nodeAsyncMap = nodeAsyncMap

  try {
    await runInRenderContext(async () => {
      // 解析根节点
      const rootNode: VNode =
        typeof (root as VNode)?.kind === 'number' ? (root as VNode) : (root as SSRApp).rootNode

      // 渲染根节点（构建虚拟节点树，异步任务绑定到节点）
      renderNode(rootNode)

      // 流式输出（逐个节点序列化，遇到异步则等待）
      const sink = new StreamingSink(options)
      await streamSerializeNode(rootNode, sink, nodeAsyncMap)

      // 清理内部状态
      delete context.$nodeAsyncMap

      options.close()
    }, context)
  } catch (err) {
    options.error(err as Error)
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
  let rejectStream: (err: Error) => void

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
