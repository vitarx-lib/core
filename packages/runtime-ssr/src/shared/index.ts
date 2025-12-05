// 导出常量
export { __IS_SERVER__, ASYNC_TASKS_KEY } from './constants.js'

// 导出上下文类型
export type { SSRContext } from './context.js'

// 导出接收器
export { StringSink, StreamSink, type Sink } from './sink.js'

// 导出 HTML 辅助函数
export {
  escapeHTML,
  serializeAttributes,
  tagOpen,
  tagClose,
  tagSelfClosing
} from './html.js'

// 导出序列化工具
export { serializeVNodeToSink } from './serialize.js'
