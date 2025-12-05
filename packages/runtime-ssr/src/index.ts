// ============================================================
// SSR 应用
// ============================================================
export { SSRApp, createSSRApp } from './app/index.js'

// ============================================================
// 共享模块
// ============================================================
export type { SSRContext, SSRRenderMode, SSRInternalContext } from './shared/context.js'
export { useSSRContext, isSSR, isHydrating, getSSRRenderMode } from './shared/context.js'
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

export {
  renderToString,
  renderToStream,
  renderToReadableStream,
  renderToNodeStream,
  pipeToWritable,
  type StreamRenderOptions
} from './server/index.js'
