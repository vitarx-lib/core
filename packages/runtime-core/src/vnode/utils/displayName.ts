import type { WidgetType } from '../../types/index.js'

/**
 * 获取组件名称的函数
 * @param widget - WidgetType 类型的组件对象，包含 displayName 和 name 属性
 * @returns 返回组件的显示名称，如果不存在则返回名称，如果都不存在则返回 'AnonymousWidget'
 */
export function getWidgetName(widget: WidgetType) {
  // 首先检查 displayName 是否为字符串且存在
  return typeof widget.displayName === 'string' && widget.displayName
    ? widget.displayName // 如果 displayName 存在，返回它
    : widget.name || 'AnonymousWidget' // 否则返回 name，如果 name 也不存在则返回默认名称
}
