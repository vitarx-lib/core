import { getCurrentVNode } from '../../runtime/index.js'
import type { WidgetRuntime } from './WidgetRuntime.js'

/**
 * 获取当前组件运行时实例
 *
 * @returns {WidgetRuntime} 返回当前活动的组件运行时实例，如果没有则返回 undefined
 */
export function getCurrentInstance(): WidgetRuntime {
  const node = getCurrentVNode()
  if (!node || !node.runtimeInstance) {
    throw new Error('No active widget instance found.')
  }
  return node.runtimeInstance
}
