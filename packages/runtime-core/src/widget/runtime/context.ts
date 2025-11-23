import { getCurrentVNode } from '../../runtime/index.js'
import { isStatefulWidgetNode } from '../../utils/index.js'
import { Widget } from '../base/index.js'

/**
 * 获取当前组件实例
 *
 * 注意：无状态组件没有实例！
 *
 * @template T - 组件实例的类型
 * @returns 返回当前活动的 Widget 实例，如果没有则返回 undefined
 */
export function getCurrentInstance<T extends Widget = Widget>(): T | undefined {
  const node = getCurrentVNode()
  if (isStatefulWidgetNode(node)) {
    return node.runtimeInstance?.instance as T
  }
}
