// 导出上下文类型和函数
export type { SSRContext, SSRInternalContext } from './context.js'
export { useSSRContext, isSSR, isHydrating } from './context.js'

// 导出接收器
export { StringSink, StreamingSink, type Sink } from './sink.js'

// 导出 HTML 辅助函数
export { escapeHTML, serializeAttributes, tagOpen, tagClose, tagSelfClosing } from './html.js'
