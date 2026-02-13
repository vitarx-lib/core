// 导出上下文类型和函数
export type { SSRContext, SSRInternalContext } from './context.js'
export { useSSRContext, isSSR, isHydrating } from './context.js'

// 导出接收器
export { StringSink, type StreamingSink, type Sink } from './sink.js'
