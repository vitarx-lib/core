import type { HostParentElement, VNode } from '@vitarx/runtime-core'
import { mountNode, renderNode, runInRenderContext, setDefaultDriver } from '@vitarx/runtime-core'
import { registerDefaultDrivers } from '@vitarx/runtime-drivers'
import type { SSRApp } from '../app/index.js'
import { SSRRenderDriver } from '../server/index.js'
import type { SSRContext } from '../shared/context.js'
import { activateNode } from './activate.js'

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
 * 3. 上下文设置 - 设置 context.$isHydrating = true, $asyncTasks = []
 * 4. 注册水合驱动 - setDefaultDriver(new HydrateDriver())
 * 5. 预渲染 - 在 runInRenderContext 中调用 renderNode(rootNode)
 * 6. 等待异步 - 循环等待 $asyncTasks 中所有 Promise 完成
 * 7. 渐进式激活 - await activateNode(rootNode, container, [])
 * 8. 移除水合驱动 - setDefaultDriver(null)
 * 9. 注册默认驱动 - setupDefaultDrivers()
 * 10. 挂载 - mountNode(rootNode, container)
 * 11. 清理标识 - 清除 $isHydrating, $asyncTasks
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

      // 6. 等待所有异步任务完成（遍历节点树）
      await waitAllAsyncTasks(rootNode, nodeAsyncMap)

      // 7. 渐进式激活 - 逐节点激活并匹配 DOM（使用顺序匹配）
      await activateNode(rootNode, containerEl)

      // 8. 移除水合驱动
      setDefaultDriver(null)

      // 9. 注册默认驱动
      registerDefaultDrivers()
      // 11. 清理标识
      delete context.$isHydrating
      delete context.$nodeAsyncMap
      delete context.$hydrateContainer
    }, context)
    // 10. 挂载 - 正常挂载，驱动器会检测 el 已存在
    mountNode(rootNode, containerEl as HostParentElement)
  } catch (error) {
    // 异常降级 - 清除水合标识，回退到正常渲染
    console.error('[hydrate] Hydration failed, falling back to normal rendering:', error)
    delete context.$isHydrating
    delete context.$nodeAsyncMap
    delete context.$hydrateContainer
    throw error
  }
}

/**
 * 等待所有异步任务完成
 * 遍历节点树，检查每个节点是否有异步任务，如果有则等待
 */
async function waitAllAsyncTasks(
  node: VNode,
  nodeAsyncMap: WeakMap<VNode, Promise<unknown>>
): Promise<void> {
  // 检查当前节点是否有异步任务
  const asyncTask = nodeAsyncMap.get(node)
  if (asyncTask) {
    await asyncTask
    nodeAsyncMap.delete(node)
  }

  // 遍历子节点
  if ('children' in node && Array.isArray((node as any).children)) {
    for (const child of (node as any).children) {
      await waitAllAsyncTasks(child, nodeAsyncMap)
    }
  }

  // 处理 Widget 的 child
  if ('instance' in node && (node as any).instance?.child) {
    await waitAllAsyncTasks((node as any).instance.child, nodeAsyncMap)
  }
}
