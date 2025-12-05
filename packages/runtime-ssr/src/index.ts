// ============================================================
// SSR 应用
// ============================================================
export { SSRApp, createSSRApp } from './app/index.js'

// ============================================================
// 共享模块
// ============================================================
export type { SSRContext, SSRRenderMode, SSRInternalContext } from './shared/context.js'
export { useSSRContext, isSSR, getSSRRenderMode } from './shared/context.js'
export { StringSink, type Sink } from './shared/sink.js'
export {
  escapeHTML,
  serializeAttributes,
  tagOpen,
  tagClose,
  tagSelfClosing
} from './shared/html.js'
export { serializeVNodeToSink } from './shared/serialize.js'
export { __IS_SERVER__ } from './shared/constants.js'

// ============================================================
// 服务端渲染
// ============================================================
export { SSRRenderDriver } from './server/index.js'

// 字符串渲染
export { renderToString } from './server/string/index.js'

// 流式渲染
export {
  renderToStream,
  renderToReadableStream,
  renderToNodeStream,
  pipeToWritable,
  type StreamRenderOptions
} from './server/stream/index.js'

// ============================================================
// 客户端水合
// ============================================================
export { hydrate, createHydrateApp, type HydrateOptions } from './client/index.js'

// ============================================================
// 自动初始化
// ============================================================
import './factory.js'
