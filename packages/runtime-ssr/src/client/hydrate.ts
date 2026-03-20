import { type HostContainer, isView, RENDER_CONTEXT, type View } from '@vitarx/runtime-core'
import { isPlainObject } from '@vitarx/utils'
import type { SSRApp } from '../app/index.js'
import type { SSRContext } from '../shared/context.js'
import { hydrateNode } from './activate.js'
import { resolveContainer } from './utils.js'

/**
 * 全局状态注入类型（由服务端注入到客户端的状态）
 */
declare global {
  interface Window {
    __INITIAL_STATE__?: Record<string, any>
  }
}

/**
 * 客户端水合函数
 *
 * 将服务端渲染的 HTML 激活为可交互的应用，复用已有 DOM 结构。
 *
 * @param root - App实例 / 根节点
 * @param container - 挂载容器，可以是 DOM 元素或选择器字符串
 * @param context - SSR 上下文对象，可选
 *
 * @example
 * ```ts
 * const app = createSSRApp(App)
 * await hydrate(app, '#app', window.__INITIAL_STATE__)
 * ```
 */
export function hydrate(
  root: SSRApp | View,
  container: HostContainer | string,
  context?: SSRContext
): Promise<void> {
  // 容器解析
  const containerEl = resolveContainer(container)
  if (!containerEl) {
    throw new Error(`[hydrate] container not found: ${container}`)
  }
  const isApp = !isView(root)
  const rootView: View = isApp ? root.rootView : root
  if (!rootView) {
    throw new TypeError('[hydrate] root is not a valid View or App instance')
  }

  context = isPlainObject(context) ? { ...context } : {}

  if (isApp) {
    // 设置客户端水合标识
    context.$isHydrating = true
    // 提供客户端渲染上下文
    root.provide(RENDER_CONTEXT, context)
  }

  return new Promise(async resolve => {
    try {
      rootView.init(isApp ? { app: root } : undefined)
      if (containerEl.childNodes.length > 0) {
        // 渐进式激活 - 逐节点激活，遇到异步节点时等待完成后继续
        await hydrateNode(rootView, containerEl)
      }
    } catch (err) {
      console.error('[hydrate] Hydration failed:', err)
      // 清空容器
      containerEl.innerHTML = ''
    } finally {
      context.$isHydrating = false
      rootView.mount(containerEl)
      resolve()
    }
  })
}
