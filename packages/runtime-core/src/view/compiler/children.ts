import { isRef, Ref } from '@vitarx/responsive'
import type { ResolvedChildren, ValidChildren, View } from '../../types/index.js'
import { isView } from '../../utils/is.js'
import { TextView } from '../implements/atomic.js'
import { DynamicView } from '../implements/index.js'

/**
 * 解析子元素并转换为适当的视图类型（基础版）
 *
 * 需要外部传入 createDynamicView 工厂函数，用于打破 DynamicView ↔ resolve 的循环依赖。
 * 公共 API 见 resolve.ts 中的 resolveChild（固定使用 createDynamicView）。
 *
 * @param child - 需要解析的子元素
 * @param createDynamicView - 创建动态视图的工厂函数
 * @returns 对应的视图对象，无法处理时返回 null
 */
export function resolveChildBase(
  child: unknown,
  createDynamicView: <T>(source: Ref<T>) => DynamicView<T>
): View | null {
  if (isRef(child)) return createDynamicView(child)
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
 * @param createDynamicView - 创建动态视图的工厂函数
 * @returns 解析后的子节点数组
 */
export function resolveChildrenBase(
  children: ValidChildren,
  createDynamicView: <T>(source: Ref<T>) => DynamicView<T>
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
    const view = resolveChildBase(current, createDynamicView)
    if (view) childList.push(view)
  }

  return __VITARX_DEV__ ? Object.freeze(childList) : childList
}
