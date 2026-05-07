import { useView } from '../runtime/context.js'
import type { ResolvedChildren, ValidChildren, View } from '../types/index.js'
import { resolveChild, resolveChildren } from '../view/compiler/utils.js'

/**
 * 格式化组件的 props.children 为类型安全的 View 数组
 *
 * 当组件需要消费 children 时，使用此函数将 ValidChildren（可能包含 Ref、
 * 原始值等）归一化为 ResolvedChildren（readonly View[]）。
 *
 * 解决的问题：
 * - 编译辅助函数（branch、expr 等）返回的数据源类型与 View 不兼容
 * - 用户声明 children: View 时，运行时实际传入的可能不是 View
 * - 此函数在消费端按需归一化，避免生产端预包装的性能浪费
 *
 * @param children 组件接收到的 props.children，不传则自动从当前组件视图获取
 * @returns {ResolvedChildren} 归一化后的子视图数组（ResolvedChildren）
 *
 * @example
 * ```tsx
 * // 无参调用：自动获取当前组件的 props.children
 * function Test() {
 *   const children = useChildren()
 *   // children: readonly View[]
 *   return <div>{children}</div>
 * }
 *
 * // 显式传参：手动指定 children 来源
 * function Test(props: { children: ValidChildren }) {
 *   const children = useChildren(props.children)
 *   return <div>{children}</div>
 * }
 * ```
 */
export function useChildren(children?: ValidChildren | undefined): ResolvedChildren {
  if (arguments.length > 0) {
    return resolveChildren(children)
  }
  const view = useView(true)
  if (!view) {
    throw new Error('useChildren() must be called in a component context')
  }
  return resolveChildren(view.props.children as ValidChildren)
}

/**
 * 快速归一化单个子视图
 *
 * 当组件期望 children 是单个 View 时（如 Suspense 的 children: View），
 * 使用此函数直接归一化为 `View | null`，跳过 `useChildren` 的数组扁平化开销。
 *
 * 与 `useChildren` 的区别：
 * - `useChildren()` 返回 `View[]`，处理所有子节点（含数组扁平化）
 * - `useFastChild()` 返回 `View | null`，仅处理单个子节点（零数组开销）
 *
 * @param children 组件接收到的 props.children，不传则自动从当前组件视图获取
 * @returns {View | null} 归一化后的单个视图，无法解析时返回 null
 *
 * @example
 * ```tsx
 * // 无参调用：自动获取当前组件的 props.children
 * function Suspense() {
 *   const child = useFastChild()
 *   // child: View | null
 *   if (!child) return new CommentView('empty')
 *   child.init(context)
 *   return child
 * }
 *
 * // 显式传参
 * function Test(props: { children: ValidChildren }) {
 *   const child = useFastChild(props.children)
 *   return child
 * }
 * ```
 */
export function useFastChild(children?: ValidChildren | undefined): View | null {
  if (arguments.length > 0) {
    return resolveChild(Array.isArray(children) ? children[0] : children)
  }
  const view = useView(true)
  if (!view) {
    throw new Error('useFastChild() must be called in a component context')
  }
  const raw = view.props.children
  return resolveChild(Array.isArray(raw) ? raw[0] : raw)
}
