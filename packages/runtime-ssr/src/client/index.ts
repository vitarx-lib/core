/**
 * 客户端水合模块
 *
 * 水合逻辑已集成到 SSRApp.mount() 方法中，
 * 在客户端调用 mount 时会自动检测是否需要水合。
 *
 * @example
 * ```ts
 * // 客户端
 * import { createSSRApp } from '@vitarx/runtime-ssr'
 * const app = createSSRApp(App)
 * app.mount('#app', window.__SSR_CONTEXT__)
 * ```
 */

export { HydrateDriver } from './drivers/index.js'
