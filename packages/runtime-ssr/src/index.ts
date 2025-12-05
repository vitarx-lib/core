// ============================================================
// SSR 应用
// ============================================================
export { SSRApp, createSSRApp } from './app/index.js'

// ============================================================
// 共享模块
// ============================================================
export type { SSRContext } from './shared/context.js'
export { StringSink, StreamSink, type Sink } from './shared/sink.js'
export {
  escapeHTML,
  serializeAttributes,
  tagOpen,
  tagClose,
  tagSelfClosing
} from './shared/html.js'
export { serializeVNodeToSink } from './shared/serialize.js'
export { ASYNC_TASKS_KEY, __IS_SERVER__ } from './shared/constants.js'

// ============================================================
// 服务端渲染
// ============================================================
export { AsyncDriver, setupServerDrivers } from './server/index.js'

// 字符串渲染
export { renderToString } from './server/string/index.js'

// 流式渲染
export {
  renderToStream,
  renderToNodeStream,
  pipeToWritable,
  type StreamRenderOptions,
  type StreamAsyncStrategy
} from './server/stream/index.js'

// ============================================================
// 客户端水合（预留）
// ============================================================
// export { hydrate } from './client/index.js'

// ============================================================
// 自动初始化
// ============================================================
import './factory.js'
