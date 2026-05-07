import { isRef } from '@vitarx/responsive'
import type { ResolvedChildren, ValidChildren, View } from '../../types/index.js'
import { DynamicView } from '../implements/dynamic.js'
import { resolveChildBase, resolveChildrenBase } from './children.js'

/**
 * 解析子节点并返回对应的视图实例
 *
 * @param child - 需要解析的子节点，可以是任意类型
 * @returns 返回解析后的视图实例，如果无法解析则返回null
 *
 * @description
 * 该函数会根据输入的子节点类型进行不同的处理：
 * - 如果子节点是Ref类型，则创建并返回一个DynamicView实例
 * - 否则调用resolveChildBase函数进行基础解析
 *
 * @example
 * ```typescript
 * const refChild = ref('content');
 * const view = resolveChild(refChild); // 返回DynamicView实例
 * ```
 */
export function resolveChild(child: unknown): null | View {
  if (isRef(child)) {
    return new DynamicView(child)
  }
  return resolveChildBase(child)
}

/**
 * 解析并扁平化子节点数组
 *
 * 该函数使用迭代而非递归的方式处理嵌套的子节点数组，
 * 避免了深度嵌套时可能导致的栈溢出问题。
 *
 * 主要处理流程：
 * 1. 使用栈结构进行迭代处理，扁平化嵌套数组
 * 2. 非View的child转换为动态/文本视图
 * 3. 建立子节点与父节点的关联
 *
 * @param children 子节点或子节点列表，可以是单个值、数组或嵌套数组
 * @returns {ResolvedChildren} 解析后的子节点数组
 */
export function resolveChildren(children: ValidChildren): ResolvedChildren {
  return resolveChildrenBase(children, resolveChild)
}
