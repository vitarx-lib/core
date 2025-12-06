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
import { useSSRContext } from '../shared/index.js'

/**
 * SSRRenderDriver 是一个用于服务端渲染(SSR)和客户端水合的节点驱动器实现类。
 * 该类负责渲染虚拟节点树并处理异步任务队列。
 *
 * 支持两种渲染模式：
 * - `sync`: 同步渲染，等待所有异步任务完成后一次性输出
 * - `stream`: 流式阻塞渲染，遇到异步时阻塞等待完成后继续输出
 *
 * 异步组件的解析逻辑已统一在 onRender 钩子中处理，
 * 只需通过 invokeHook(render) 收集返回的 Promise。
 *
 * 使用场景：
 * - 服务端：renderToString / renderToStream
 * - 客户端：水合阶段预渲染
 *
 * 使用限制：
 * - 不支持激活/停用节点操作
 * - 不支持挂载/卸载节点操作
 * - 不支持属性更新操作
 */
export class SSRRenderDriver<T extends NodeType> implements NodeDriver<T> {
  render(node: VNode<T>): ElementOf<T> {
    // 从渲染上下文中获取 SSR 上下文
    const ctx = useSSRContext()
    if (!ctx) return node as ElementOf<T>

    const nodeAsyncMap = ctx.$nodeAsyncMap

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
        const widgetNode = node as StatefulWidgetNode

        // 禁用客户端特性，仅用于 SSR
        const options: StatefulManagerOptions = {
          enableAutoUpdate: false,
          enableScheduler: false,
          enableLifecycle: false
        }
        const runtime = createWidgetRuntime(widgetNode, options)

        // 执行 onRender 钩子，异步组件的解析 Promise 也会在这里返回
        const result = runtime.invokeHook(LifecycleHooks.render)

        // 统一将异步任务绑定到节点
        if (isPromise(result) && nodeAsyncMap) {
          nodeAsyncMap.set(widgetNode, result)
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
    throw new Error('[SSRRenderDriver] activate is not supported in this driver')
  }
  deactivate(): void {
    throw new Error('[SSRRenderDriver] deactivate is not supported in this driver')
  }
  mount(): void {
    throw new Error('[SSRRenderDriver] mount is not supported in this driver')
  }
  unmount(): void {
    throw new Error('[SSRRenderDriver] unmount is not supported in this driver')
  }
  updateProps(): void {
    throw new Error('[SSRRenderDriver] updateProps is not supported in this driver')
  }
}
