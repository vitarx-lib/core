import { getContext, runInContext } from '@vitarx/responsive'
import type { Widget } from '../widget/index.js'
import type { WidgetVNode } from './nodes/index.js'

const VNODE_CONTEXT_SYMBOL = Symbol('WidgetVNode Context Symbol')

/**
 * 在指定上下文中执行函数
 *
 * @template R - 函数返回值的类型
 * @param node - 组件虚拟节点
 * @param {() => R} fn - 需要在特定上下文中执行的函数
 * @returns {R} 函数执行后的返回值
 */
export function runInNodeContext<R>(node: WidgetVNode, fn: () => R): R {
  // 调用runInContext函数，传入虚拟节点上下文符号、当前对象和要执行的函数
  return runInContext(VNODE_CONTEXT_SYMBOL, node, fn)
}

/**
 * 获取当前组件的虚拟节点
 * @returns {WidgetVNode | undefined} 返回当前组件的虚拟节点，如果没有则返回undefined
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  // 调用runInContext函数，传入虚拟节点上下文符号和getCurrentVNode函数，返回当前组件虚拟节点
  return getContext<WidgetVNode>(VNODE_CONTEXT_SYMBOL)
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
