import { getContext, runInContext } from '@vitarx/responsive'
import type { App } from '../app/index.js'
import { APP_CONTEXT_SYMBOL, VNODE_CONTEXT_SYMBOL } from '../constants/index.js'
import type { WidgetVNode } from '../types/index.js'

/**
 * 在应用程序上下文中执行函数
 * @param app 应用程序实例
 * @param fn 需要在应用上下文中执行的函数
 * @returns {any} 函数执行后的返回值
 */
export function runInAppContext<R>(app: App, fn: () => R): R {
  // 使用APP_CONTEXT_SYMBOL作为上下文标识符，在指定应用上下文中执行函数
  return runInContext(APP_CONTEXT_SYMBOL, app, fn)
}

/**
 * 获取应用程序上下文的函数
 * 该函数用于从全局上下文中获取App类型的实例
 *
 * @template T - 应用程序实例的类型，默认为App
 * @returns {App | undefined} 返回App类型的实例，如果不存在则返回undefined
 */
export function getAppContext<T extends App = App>(): T | undefined {
  // 调用getContext函数，传入APP_CONTEXT_SYMBOL作为key，并指定返回类型为App
  return getContext<T>(APP_CONTEXT_SYMBOL)
}

/**
 * 在指定组件节点上下文中执行函数
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
 *
 * @template T - 虚拟节点的类型
 * @returns {WidgetVNode | undefined} 返回当前组件的虚拟节点，如果没有则返回undefined
 */
export function getCurrentVNode(): WidgetVNode | undefined {
  // 调用runInContext函数，传入虚拟节点上下文符号和getCurrentVNode函数，返回当前组件虚拟节点
  return getContext<WidgetVNode>(VNODE_CONTEXT_SYMBOL)
}
