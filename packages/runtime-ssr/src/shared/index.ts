// 导出常量
export { __IS_SERVER__ } from './constants.js'

// 导出上下文类型和函数
export type { SSRContext, SSRRenderMode, SSRInternalContext } from './context.js'
export { useSSRContext, isSSR, getSSRRenderMode } from './context.js'

// 导出接收器
export { StringSink, type Sink } from './sink.js'

// 导出 HTML 辅助函数
export { escapeHTML, serializeAttributes, tagOpen, tagClose, tagSelfClosing } from './html.js'

// 导出序列化工具
export { serializeVNodeToSink } from './serialize.js'
