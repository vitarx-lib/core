import {
  createWidgetRuntime,
  type ElementOf,
  type FragmentNode,
  LifecycleHooks,
  NodeDriver,
  NodeKind,
  type NodeType,
  type RegularElementNode,
  renderNode,
  type StatefulManagerOptions,
  type StatefulWidgetNode,
  type StatelessWidgetNode,
  type VNode
} from '@vitarx/runtime-core'
import { isPromise } from '@vitarx/utils'
import { useSSRContext } from '../../shared/context.js'
import { ASYNC_TASKS_KEY } from '../../shared/index.js'

/**
 * SSRRenderDriver 是一个用于服务端渲染(SSR)的节点驱动器实现类。
 * 该类负责在服务端环境中渲染虚拟节点树，并处理异步任务队列。
 *
 * 主要功能：
 * - 渲染不同类型的节点（常规元素、片段、有状态和无状态组件）
 * - 管理异步渲染任务
 * - 提供服务端环境下的渲染限制和错误处理
 *
 * 使用示例：
 * ```typescript
 * const driver = new SSRRenderDriver<NodeType>();
 * const vnode = createVNode(...);
 * const result = driver.render(vnode);
 * ```
 *
 * 构造函数参数：
 * - 泛型参数 T extends NodeType：指定节点类型
 *
 * 使用限制：
 * - 不支持激活/停用节点操作
 * - 不支持挂载/卸载节点操作
 * - 不支持属性更新操作
 * - 所有上述操作都会抛出错误
 */
export class SSRRenderDriver<T extends NodeType> implements NodeDriver<T> {
  render(node: VNode<T>): ElementOf<T> {
    // 从渲染上下文中获取异步任务队列
    const ctx = useSSRContext()
    if (!ctx) return node as ElementOf<T>
    const asyncTasks = ctx[ASYNC_TASKS_KEY] as Promise<unknown>[]

    switch (node.kind) {
      case NodeKind.REGULAR_ELEMENT:
        // v-html: 内容在最终序列化阶段处理，这里不再渲染子树
        if (!node.props['v-html']) {
          for (const child of (node as unknown as RegularElementNode).children) {
            renderNode(child)
          }
        }
        break
      case NodeKind.FRAGMENT:
        for (const child of (node as unknown as FragmentNode).children) {
          renderNode(child)
        }
        break
      case NodeKind.STATEFUL_WIDGET: {
        const options: StatefulManagerOptions = {
          enableAutoUpdate: false,
          enableScheduler: false,
          enableLifecycle: false,
          onResolve(promise) {
            if (ctx.$renderMode !== 'ignore') asyncTasks.push(promise)
          }
        }
        const result = createWidgetRuntime(node as StatefulWidgetNode, options).invokeHook(
          LifecycleHooks.render
        )
        // 仅在同步模式下
        if (ctx.$renderMode !== 'ignore' && isPromise(result)) {
          asyncTasks.push(result)
        }
        break
      }
      case NodeKind.STATELESS_WIDGET:
        renderNode(createWidgetRuntime(node as StatelessWidgetNode).child)
        break
    }
    return node as ElementOf<T>
  }
  activate(): void {
    throw new Error('[SSR] Activation is not allowed when rendering on the server side')
  }
  deactivate(): void {
    throw new Error('[SSR] Deactivate is not allowed when rendering on the server side')
  }
  mount(): void {
    throw new Error('[SSR] Mounting is not allowed when rendering on the server side')
  }
  unmount(): void {
    throw new Error('[SSR] Unmount is not allowed when rendering on the server side')
  }
  updateProps(): void {
    throw new Error('[SSR] Update props is not allowed when rendering on the server side')
  }
}
