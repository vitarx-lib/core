import { WidgetVNode } from '../vnode/index'
import type { Widget } from './widget'

/**
 * 获取当前组件实例
 * 该函数用于获取当前活动的 Widget 实例
 * 通过 WidgetVNode 的 getCurrentVNode 方法获取当前虚拟节点，然后返回其关联的实例
 *
 * @alias useCurrentInstance
 * @returns 返回当前活动的 Widget 实例，如果没有则返回 undefined
 */
export function getCurrentInstance(): Widget | undefined {
  return WidgetVNode.getCurrentVNode()?.instance // 使用可选链操作符安全地获取当前虚拟节点关联的实例
}

export { getCurrentInstance as useCurrentInstance }
