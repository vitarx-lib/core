import { type HostContainer, isView, RENDER_CONTEXT, type View } from '@vitarx/runtime-core'
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
 * 完整执行流程：
 * 1. 容器解析 - 解析 container 为 DOM 元素
 * 2. 状态恢复 - 合并 window.__INITIAL_STATE__ 到 context
 * 3. 上下文设置 - 设置 context.$isHydrating = true, $nodeAsyncMap
 * 4. 注册水合驱动 - setDefaultDriver(new SSRRenderDriver())
 * 5. 预渲染 - 在 runInRenderContext 中调用 renderNode(rootNode)
 * 6. 渐进式激活 - 逐节点激活，遇到异步节点时等待完成后继续
 * 7. 移除水合驱动 - setDefaultDriver(null)
 * 8. 清理标识 - 清除 $isHydrating, $nodeAsyncMap
 * 9. 注册默认驱动 - registerDefaultDrivers()
 * 10. 挂载根节点 - mountNode(rootNode, containerEl)
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
  context: SSRContext = {}
): Promise<void> {
  // 容器解析
  const containerEl = resolveContainer(container)
  if (!containerEl) {
    throw new Error(`[hydrate] Container not found: ${container}`)
  }
  const isApp = !isView(root)
  // 获取根节点
  const rootView: View = isApp ? root.rootView : root
  if (!rootView) {
    throw new TypeError('[hydrate] root is not a valid virtual node or App instance')
  }
  if (isApp) {
    // 状态恢复 - 合并服务端注入的状态
    if (typeof window !== 'undefined' && window.__INITIAL_STATE__) {
      Object.assign(context, window.__INITIAL_STATE__)
    }
    // 设置客户端水合标识
    context.$isHydrating = true
    // 提供客户端渲染上下文
    root.provide(RENDER_CONTEXT, context)
  }

  return new Promise(async resolve => {
    try {
      rootView.init(isApp ? { app: root } : undefined)
      if (containerEl.childNodes.length > 0) {
        // 6. 渐进式激活 - 逐节点激活，遇到异步节点时等待完成后继续
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
