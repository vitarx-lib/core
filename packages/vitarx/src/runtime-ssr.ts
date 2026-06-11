// ======================== 公共 API（需要文档） ========================

// SSR 应用
export { createSSRApp, SSRApp } from '@vitarx/runtime-ssr'

// SSR 渲染
export { renderToString, renderToStream } from '@vitarx/runtime-ssr'

// 水合
export { hydrate } from '@vitarx/runtime-ssr'

// SSR 判断
export { isSSR, isHydrating } from '@vitarx/runtime-ssr'

// SSR 上下文
export { useSSRContext } from '@vitarx/runtime-ssr'

// 流式渲染
export { renderToReadableStream, renderToNodeStream, pipeToWritable } from '@vitarx/runtime-ssr'

// 公共类型
export type { SSRContext, SSRInternalContext, Sink, StreamingSink } from '@vitarx/runtime-ssr'
