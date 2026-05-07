import { isRef } from '@vitarx/responsive'
import type { ResolvedChildren, ValidChildren, View } from '../../types/index.js'
import { isView } from '../../utils/is.js'
import { TextView } from '../implements/atomic.js'

/**
 * 解析子元素并返回对应的视图对象
 *
 * @param child - 待解析的子元素，可以是任意类型
 * @returns 返回解析后的视图对象，如果无法解析则返回null
 *
 * 处理规则：
 * - 如果子元素已经是View类型，直接返回
 * - 如果子元素是字符串或数字类型，转换为TextView
 * - 空字符串会返回null
 * - 其他类型返回null
 *
 * @example
 * // 字符串子元素
 * resolveChildBase("hello") // 返回 TextView("hello")
 *
 * // 数字子元素
 * resolveChildBase(123) // 返回 TextView("123")
 *
 * // 空字符串
 * resolveChildBase("") // 返回 null
 *
 * // View类型子元素
 * const view = new TextView("test")
 * resolveChildBase(view) // 返回 view 本身
 *
 * // 其他类型
 * resolveChildBase(null) // 返回 null
 * resolveChildBase(undefined) // 返回 null
 * resolveChildBase({}) // 返回 null
 */
export function resolveChildBase(child: unknown): View | null {
  if (isView(child)) return child
  const type = typeof child
  if (type === 'string' || type === 'number') {
    const text = String(child)
    return text.length === 0 ? null : new TextView(text)
  }
  return null
}

/**
 * 解析并扁平化子节点数组（基础版）
 *
 * 需要外部传入 createDynamicView 工厂函数，用于打破 DynamicView ↔ resolve 的循环依赖。
 * 公共 API 见 resolve.ts 中的 resolveChildren（固定使用 createDynamicView）。
 *
 * @param children - 子节点或子节点列表
 * @param resolveChild - 解析子元素的函数
 * @returns 解析后的子节点数组
 */
export function resolveChildrenBase(
  children: ValidChildren,
  resolveChild: (child: unknown) => View | null = resolveChildBase
): ResolvedChildren {
  const childList: View[] = []
  if (children == null) return childList

  const stack: ValidChildren[] = []

  const pushArrayToStack = (arr: ValidChildren[]) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      stack.push(arr[i])
    }
  }

  if (Array.isArray(children)) {
    pushArrayToStack(children)
  } else {
    stack.push(children)
  }

  while (stack.length > 0) {
    const current = stack.pop()!

    if (Array.isArray(current)) {
      pushArrayToStack(current)
      continue
    }
    const view = resolveChild(current)
    if (view) childList.push(view)
  }

  return __VITARX_DEV__ ? Object.freeze(childList) : childList
}

/**
 * 检查给定的值是否是有效的子元素
 *
 * @param value - 需要检查的值，可以是任何类型
 * @returns {boolean} 返回一个布尔值，表示值是否是有效的子元素
 *          如果值是字符串、数字、视图、数组或引用，则返回true
 */
export function isValidChild(value: any): value is ValidChildren {
  const type = typeof value
  return (
    type === 'string' || type === 'number' || isView(value) || Array.isArray(value) || isRef(value)
  )
}
