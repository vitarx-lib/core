import {
  type AnyProps,
  createWidgetRuntime,
  type FragmentVNode,
  type HostNodeElements,
  type HostParentElement,
  LifecycleHooks,
  type NodeDriver,
  type NodeElementType,
  NodeKind,
  type OpsType,
  type RegularElementVNode,
  renderNode,
  type StatefulManagerOptions,
  type StatefulWidgetVNode,
  type StatelessWidgetVNode,
  useRenderContext,
  type VNode,
  type VNodeTypes
} from '@vitarx/runtime-core'
import { isPromise } from '@vitarx/utils/src/index.js'

export class SSRSyncRenderDriver<T extends VNodeTypes> implements NodeDriver<T> {
  activate(_node: VNode<T>, _root: boolean): void {
    throw new Error('[SSR] Activation is not allowed when rendering on the server side')
  }

  deactivate(_node: VNode<T>, _root: boolean): void {
    throw new Error('[SSR] Deactivate is not allowed when rendering on the server side')
  }

  mount(_node: VNode<T>, _target?: HostNodeElements | HostParentElement, _opsType?: OpsType): void {
    throw new Error('[SSR] Mounting is not allowed when rendering on the server side')
  }

  render(node: VNode<T>): NodeElementType<T> {
    // 从渲染上下文中获取异步任务队列
    const ctx = (useRenderContext<Record<string, any>>() || {}) as Record<string, any>
    if (!Array.isArray(ctx.__asyncTasks)) ctx.__asyncTasks = []
    const asyncTasks = ctx.__asyncTasks as Promise<unknown>[]

    switch (node.kind) {
      case NodeKind.REGULAR_ELEMENT:
        // v-html: 内容在最终序列化阶段处理，这里不再渲染子树
        if (!node.props['v-html']) {
          for (const child of (node as unknown as RegularElementVNode).children) {
            renderNode(child)
          }
        }
        break
      case NodeKind.FRAGMENT:
        for (const child of (node as unknown as FragmentVNode).children) {
          renderNode(child)
        }
        break
      case NodeKind.STATEFUL_WIDGET: {
        const options: StatefulManagerOptions = {
          enableAutoUpdate: false,
          enableScheduler: false,
          enableLifecycle: false,
          onResolve(promise) {
            asyncTasks.push(promise)
          }
        }
        const result = createWidgetRuntime(node as StatefulWidgetVNode, options).invokeHook(
          LifecycleHooks.render
        )
        if (isPromise(result)) {
          asyncTasks.push(result)
        }
        break
      }
      case NodeKind.STATELESS_WIDGET:
        renderNode(createWidgetRuntime(node as StatelessWidgetVNode).child)
        break
    }
    return undefined as any
  }

  unmount(_node: VNode<T>): void {
    throw new Error('Unmount is not allowed when rendering on the drivers side')
  }

  updateProps(_node: VNode<T>, _newProps: AnyProps, _newNode: VNode<T>): void {
    throw new Error('[SSR] Update props is not allowed when rendering on the server side')
  }
}
