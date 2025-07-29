import { createScope } from '@vitarx/responsive'
import { getCurrentVNode, isRefEl, runInVNodeContext, type VNode } from '../../vnode/index'
import { _createFnWidget, isClassWidget, Widget } from '../core/index'
import type { FunctionWidget, WidgetType } from '../types/index'
import { reportWidgetError } from './error-hanler'
import { proxyWidgetProps } from './props'

/**
 * 创建组件实例
 *
 * 用于创建组件实例，可以通过vnode.instance同步获取组件实例
 *
 * @internal 内部核心函数
 * @param {VNode<WidgetType>} vnode - 节点
 * @returns {Promise<Widget>} - 组件实例
 */
export function createInstance(vnode: VNode<WidgetType>): Promise<Widget> {
  // 获取最新模块，仅在开发时进行HMR处理
  if (import.meta.env?.MODE === 'development') {
    if (typeof window !== 'undefined') {
      // 避免未渲染的节点引用到旧模块，已渲染的节点会由 hmr 替换为最新模块
      const newModule = (window as any).__$VITARX_HMR$__?.replaceNewModule?.(vnode.type)
      if (newModule) (vnode as any).type = newModule
    }
  }
  // 创建作用域
  const scope = createScope({
    name: vnode.type.name,
    errorHandler: (e: unknown, source) => {
      reportWidgetError(e, { source: `effect.${source}`, instance: vnode.instance! })
    }
  })
  return scope.run(() =>
    runInVNodeContext(vnode, () => {
      // 包装props为响应式对象
      ;(vnode as any).props = proxyWidgetProps(vnode.props)
      // 异步实例
      if (isClassWidget(vnode.type)) {
        vnode.instance = new vnode.type(vnode.props)
      } else {
        _createFnWidget(vnode as VNode<FunctionWidget>).then()
      }
      // 绑定ref
      if (isRefEl(vnode.ref)) vnode.ref.value = vnode.instance!
      return new Promise(resolve => resolve(vnode.instance!))
    })
  )
}

/**
 * 获取当前组件实例
 *
 * @returns {Widget|undefined} - 如果存在则返回当前组件实例，否则返回`undefined`
 */
export function useCurrentInstance(): Widget | undefined {
  return getCurrentVNode()?.instance
}
