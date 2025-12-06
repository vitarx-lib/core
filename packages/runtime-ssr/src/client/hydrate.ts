import type { HostParentElement, VNode } from '@vitarx/runtime-core'
import { mountNode, renderNode, runInRenderContext, setDefaultDriver } from '@vitarx/runtime-core'
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'
import type { SSRApp } from '../app/index.js'
import { SSRRenderDriver } from '../server/index.js'
import type { SSRContext } from '../shared/context.js'
import { hydrateNode } from './activate.js'

/**
 * 全局状态注入类型（由服务端注入到客户端的状态）
 */
declare global {
  interface Window {
    __VITARX_STATE__?: Record<string, any>
  }
}

/**
 * 客户端水合函数
 *
 * 将服务端渲染的 HTML 激活为可交互的应用，复用已有 DOM 结构。
 *
 * 完整执行流程：
 * 1. 容器解析 - 解析 container 为 DOM 元素
 * 2. 状态恢复 - 合并 window.__VITARX_STATE__ 到 context
 * 3. 上下文设置 - 设置 context.$isHydrating = true, $nodeAsyncMap
 * 4. 注册水合驱动 - setDefaultDriver(new SSRRenderDriver())
 * 5. 预渲染 - 在 runInRenderContext 中调用 renderNode(rootNode)
 * 6. 渐进式激活 - 逐节点激活，遇到异步节点时等待完成后继续
 * 7. 移除水合驱动 - setDefaultDriver(null)
 * 8. 注册默认驱动 - registerDefaultDrivers()
 * 9. 挂载 - mountNode(rootNode, container)
 * 10. 清理标识 - 清除 $isHydrating, $nodeAsyncMap
 *
 * @param app - SSR 应用实例
 * @param container - 挂载容器，可以是 DOM 元素或选择器字符串
 * @param context - SSR 上下文对象，可选
 *
 * @example
 * ```ts
 * const app = createSSRApp(App)
 * await hydrate(app, '#app', window.__SSR_CONTEXT__)
 * ```
 */
export async function hydrate(
  app: SSRApp,
  container: string | Element,
  context: SSRContext = {}
): Promise<void> {
  // 1. 容器解析
  const containerEl = typeof container === 'string' ? document.querySelector(container) : container

  if (!containerEl) {
    throw new Error(`[hydrate] Container not found: ${container}`)
  }

  // 2. 状态恢复 - 合并服务端注入的状态
  if (typeof window !== 'undefined' && window.__VITARX_STATE__) {
    Object.assign(context, window.__VITARX_STATE__)
  }

  // 获取根节点
  const rootNode: VNode =
    typeof (app as any)?.rootNode?.kind === 'number' ? (app as any).rootNode : app.rootNode
  try {
    await runInRenderContext(async () => {
      // 3. 上下文设置
      context.$isHydrating = true
      // 初始化节点异步任务映射（与服务端统一使用 WeakMap）
      const nodeAsyncMap = new WeakMap<VNode, Promise<unknown>>()
      context.$nodeAsyncMap = nodeAsyncMap
      context.$hydrateContainer = containerEl
      // 4. 注册水合驱动
      setDefaultDriver(new SSRRenderDriver())

      // 5. 预渲染 - 触发 onRender，收集异步任务到 WeakMap
      renderNode(rootNode)

      // 6. 渐进式激活 - 逐节点激活，遇到异步节点时等待完成后继续
      await hydrateNode(rootNode, containerEl, nodeAsyncMap)

      // 7. 移除水合驱动
      setDefaultDriver(null)

      // 8. 注册默认驱动
      registerDefaultDrivers()
      // 9. 清理标识
      delete context.$isHydrating
      delete context.$nodeAsyncMap
    }, context)
    // 10. 挂载 - 正常挂载，驱动器会检测 el 已存在
    mountNode(rootNode, containerEl as HostParentElement)
  } catch (error) {
    delete context.$isHydrating
    delete context.$nodeAsyncMap
    throw error
  }
}
