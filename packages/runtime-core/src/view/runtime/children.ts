import { isRef, unref } from '@vitarx/responsive'
import type { ResolvedChildren, ValidChildren, View } from '../../types/index.js'
import { isBlock } from '../../utils/index.js'
import { createDynamicView } from '../creator/dynamic.js'
import { createTextView } from '../creator/text.js'
import { isViewRef } from './ref.js'

/**
 * 解析并扁平化子节点数组
 *
 * 该函数使用迭代而非递归的方式处理嵌套的子节点数组，
 * 避免了深度嵌套时可能导致的栈溢出问题。
 *
 * 主要处理流程：
 * 1. 使用栈结构进行迭代处理，扁平化嵌套数组
 * 2. 非Block的child转换为动态/文本块
 * 3. 建立子节点与父节点的关联
 *
 * @param children 子节点或子节点列表，可以是单个值、数组或嵌套数组
 * @returns {ResolvedChildren} 解析后的子节点数组
 */
export const resolveChildren = (children: ValidChildren): ResolvedChildren => {
  if (children === null || children === undefined || typeof children === 'boolean') return []

  const childList: View[] = []
  // 使用单个栈来处理嵌套结构，避免多次创建数组
  const stack: Array<unknown> = Array.isArray(children) ? [...children] : [children]

  while (stack.length > 0) {
    const current = stack.pop()!

    // 处理数组情况：直接展开并按正确顺序推入栈
    if (Array.isArray(current)) {
      // 按原顺序逆向推入栈，这样弹出时就是正确的顺序
      for (let i = current.length - 1; i >= 0; i--) {
        const item = current[i]
        // 只有在需要时才进行unref操作
        if (isRef(item)) {
          // 对于ref，我们可以直接处理，而不是先unref再判断
          stack.push(unref(item))
        } else {
          stack.push(item)
        }
      }
      continue
    }

    // 直接处理当前项，避免重复的类型检查
    if (current == null || typeof current === 'boolean') continue

    // 直接进行类型判断，减少函数调用开销
    if (isBlock(current)) {
      childList.push(current)
    } else if (isViewRef(current)) {
      childList.push(createDynamicView(current))
    } else {
      childList.push(createTextView(String(current), location))
    }
  }

  return childList
}
