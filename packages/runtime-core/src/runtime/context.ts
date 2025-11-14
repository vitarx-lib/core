import { getContext, runInContext } from '@vitarx/responsive'
import type { AnyRecord } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import type { App } from '../app/index.js'
import { type StatefulWidgetNode, WidgetNode } from '../vnode/index.js'
import type { Widget } from '../widget/index.js'

const VNODE_CONTEXT_SYMBOL = Symbol('VNODE_CONTEXT_SYMBOL')

/**
 * 在指定组件节点上下文中执行函数
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
 *
 * @template T - 虚拟节点的类型
 * @returns {StatefulWidgetNode | undefined} 返回当前组件的虚拟节点，如果没有则返回undefined
 */
export function getCurrentVNode(): WidgetNode | undefined {
  // 调用runInContext函数，传入虚拟节点上下文符号和getCurrentVNode函数，返回当前组件虚拟节点
  return getContext<WidgetNode>(VNODE_CONTEXT_SYMBOL)
}

export { getCurrentVNode as useCurrentVNode }

/**
 * 获取当前组件实例
 *
 * 注意：无状态组件没有实例！
 *
 * @alias useCurrentInstance
 * @template T - 组件实例的类型
 * @returns 返回当前活动的 Widget 实例，如果没有则返回 undefined
 */
export function getCurrentInstance<T extends Widget = Widget>(): T | undefined {
  const node = getCurrentVNode()
  return (node as unknown as StatefulWidgetNode)?.instance as T
}

export { getCurrentInstance as useCurrentInstance }

/**
 * 获取视图强制更新器
 *
 * 此函数返回的是一个用于更新视图的函数，通常你不需要强制更新视图，响应式数据改变会自动更新视图。
 *
 * 使用场景：
 * 如果函数式组件返回的视图虚拟节点中未包含任何响应式数据，系统不会自动更新视图，可以手动调用此函数来更新视图。
 *
 * @returns {(newChildVNode?: VNode) => void} - 视图更新器
 * @throws {Error} - 非组件上下文中使用会抛出错误
 * @example
 * ```tsx
 * function FuncComponent() {
 *   let show = true
 *   const forceUpdate = useForceUpdate()
 *   const toggle = () => {
 *     show = !show
 *     //
 *     forceUpdate()
 *   }
 *   return <div>
 *     <button onClick={toggle}>Toggle</button>
 *     {show && <div>Hello World</div>}
 *   </div>
 * }
 * ```
 */
export function useForceUpdater(): () => void {
  const instance = getCurrentInstance()
  if (!instance) {
    logger.warn(
      'The useForceUpdater() API function can only be used in the top-level scope of the function component!'
    )
    return () => void 0
  }
  return () => instance.$forceUpdate()
}

const APP_CONTEXT_SYMBOL = Symbol('APP_CONTEXT_SYMBOL')
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
export { getAppContext as useAppContext }

const SSR_CONTEXT_SYMBOL = Symbol('SSR_CONTEXT_SYMBOL')

/**
 * 在SSR(服务器端渲染)上下文中运行函数
 *
 * @param context - 传递给函数的上下文对象
 * @param fn - 要在SSR上下文中运行的函数
 * @returns 函数执行的结果
 */
export function runInSSRContext<R>(context: AnyRecord, fn: () => R): R {
  // 使用SSR_CONTEXT_SYMBOL作为标识，在指定上下文中运行函数
  return runInContext(SSR_CONTEXT_SYMBOL, context, fn)
}

/**
 * 获取服务端渲染(SSR)上下文函数
 * 该函数用于在服务端渲染/客户端水合过程中获取或共享上下文数据
 *
 * @template T - 表示一个通用的记录类型，默认为 AnyRecord
 * @returns T | undefined - 返回获取到的上下文数据，如果不存在则返回 undefined
 */
export function getSSRContext<T extends AnyRecord = AnyRecord>(): T | undefined {
  // 使用 SSR_CONTEXT_SYMBOL 作为键调用 getContext 函数获取上下文
  return getContext<T>(SSR_CONTEXT_SYMBOL)
}

export { getSSRContext as useSSRContext }
