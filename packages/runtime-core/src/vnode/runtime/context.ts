import { getContext, runInContext } from '@vitarx/responsive'
import { Widget } from '../../widget/index.js'
import { VNode } from '../base/index.js'
import { WidgetNode } from '../nodes/index.js'

const VNODE_CONTEXT_SYMBOL = Symbol('WidgetVNode Context Symbol')

/**
 * 在指定上下文中执行函数
 *
 * @template R - 函数返回值的类型
 * @param node - 组件虚拟节点
 * @param {() => R} fn - 需要在特定上下文中执行的函数
 * @returns {R} 函数执行后的返回值
 */
export function runInNodeContext<R>(node: WidgetNode, fn: () => R): R {
  // 调用runInContext函数，传入虚拟节点上下文符号、当前对象和要执行的函数
  return runInContext(VNODE_CONTEXT_SYMBOL, node, fn)
}

/**
 * 获取当前组件的虚拟节点
 * @returns {WidgetNode | undefined} 返回当前组件的虚拟节点，如果没有则返回undefined
 */
export function getCurrentVNode(): WidgetNode | undefined {
  // 调用runInContext函数，传入虚拟节点上下文符号和getCurrentVNode函数，返回当前组件虚拟节点
  return getContext<WidgetNode>(VNODE_CONTEXT_SYMBOL)
}

export { getCurrentVNode as useCurrentVNode }

/**
 * 获取当前组件实例
 * 该函数用于获取当前活动的 Widget 实例
 * 通过 WidgetVNode 的 getCurrentVNode 方法获取当前虚拟节点，然后返回其关联的实例
 *
 * @alias useCurrentInstance
 * @returns 返回当前活动的 Widget 实例，如果没有则返回 undefined
 */
export function getCurrentInstance(): Widget | undefined {
  return getCurrentVNode()?.instance // 使用可选链操作符安全地获取当前虚拟节点关联的实例
}

export { getCurrentInstance as useCurrentInstance }

/**
 * 获取视图强制更新器
 *
 * 此函数返回的是一个用于更新视图的函数，通常你不需要强制更新视图，响应式数据改变会自动更新视图。
 *
 * 如果函数式组件返回的虚拟元素节点是预构建的，系统无法在初次构建视图时捕获其依赖的响应式数据，
 * 从而导致视图不会随着数据改变而更新。在这种特殊情况下你就可以使用该函数返回的视图更新器来更新视图。
 *
 * @returns {(newChildVNode?: VNode) => void} - 视图更新器
 */
export function useForceUpdate(): (newChildVNode?: VNode) => void {
  const instance = getCurrentVNode()?.instance
  if (!instance) {
    throw new Error(
      'The Vitarx.useViewForceUpdating API function can only be used in the top-level scope of the function component!'
    )
  }
  return instance?.['forceUpdate'] || (() => {})
}
