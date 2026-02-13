import { isView, RENDER_CONTEXT, type View } from '@vitarx/runtime-core'
import { SSRApp } from '../app/index.js'
import { type SSRContext } from '../shared/index.js'
import { serializeViewToSink } from '../shared/serialize.js'
import type { StreamingSink } from '../shared/sink.js'

/**
 * 将应用渲染为流
 *
 * 流式渲染，逐步输出 HTML 内容，遇到异步任务时阻塞等待完成。
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
  root: SSRApp | View,
  context: SSRContext = {},
  options: StreamingSink
): Promise<void> {
  try {
    const isApp = !isView(root)
    if (isApp) root.inject(RENDER_CONTEXT, context)
    const rootView: View = isApp ? root.rootView : root
    // 渲染根节点（构建虚拟节点树，异步任务绑定到节点）
    rootView.init(isApp ? { app: root } : undefined)
    // 流式输出（逐个节点序列化，遇到异步则等待）
    await serializeViewToSink(rootView, options)
    options.close()
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
  root: SSRApp | View,
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
  root: SSRApp | View,
  context: SSRContext = {}
): Promise<NodeJS.ReadableStream> {
  if (__SSR__) {
    const { Readable } = await import('node:stream')
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
  } else {
    throw new Error('renderToNodeStream only works in SSR mode')
  }
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
  root: SSRApp | View,
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
