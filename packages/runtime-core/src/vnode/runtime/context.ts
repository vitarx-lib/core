import { getContext, runInContext } from '@vitarx/responsive'
import { logger } from '@vitarx/utils/src/index.js'
import { Widget } from '../../widget/index.js'
import { StatefulWidgetNode } from '../nodes/index.js'

const VNODE_CONTEXT_SYMBOL = Symbol('VNODE_CONTEXT_SYMBOL')

/**
 * 在指定组件节点上下文中执行函数
 *
 * @template R - 函数返回值的类型
 * @param node - 组件虚拟节点
 * @param {() => R} fn - 需要在特定上下文中执行的函数
 * @returns {R} 函数执行后的返回值
 */
export const runInNodeContext = <R>(node: StatefulWidgetNode, fn: () => R): R => {
  // 调用runInContext函数，传入虚拟节点上下文符号、当前对象和要执行的函数
  return runInContext(VNODE_CONTEXT_SYMBOL, node, fn)
}

/**
 * 获取当前组件的虚拟节点
 *
 * @template T - 虚拟节点的类型
 * @returns {StatefulWidgetNode | undefined} 返回当前组件的虚拟节点，如果没有则返回undefined
 */
export const getCurrentVNode = <T extends StatefulWidgetNode = StatefulWidgetNode>():
  | T
  | undefined => {
  // 调用runInContext函数，传入虚拟节点上下文符号和getCurrentVNode函数，返回当前组件虚拟节点
  return getContext<T>(VNODE_CONTEXT_SYMBOL)
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
export const getCurrentInstance = <T extends Widget = Widget>(): T | undefined => {
  return (getCurrentVNode() as StatefulWidgetNode)?.instance as T // 使用可选链操作符安全地获取当前虚拟节点关联的实例
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
export const useForceUpdate = (): (() => void) => {
  const instance = getCurrentInstance()
  if (!instance) {
    logger.warn(
      'The useForceUpdate() API function can only be used in the top-level scope of the function component!'
    )
    return () => void 0
  }
  return () => instance.$forceUpdate()
}
