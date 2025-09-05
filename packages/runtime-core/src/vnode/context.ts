import { getContext, runInContext } from '@vitarx/responsive'
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
