import { hasPropTrack, isRef, toRef } from '@vitarx/responsive'
import { isFunction } from '@vitarx/utils'
import type { CodeLocation, RenderUnit } from '../../types/index.js'
import { DynamicView } from '../implements/index.js'
import { DynamicViewSource, SwitchViewSource } from './source.js'

/**
 * 创建一个表达式级动态视图（Expression-level Dynamic View）。
 *
 * `dynamic` 用于声明一个依赖响应式数据的动态子树。当构建函数内部
 * 访问的响应式依赖发生变化时，当前动态视图会自动重新执行构建函数，
 * 并根据新的返回结果更新对应的子视图。
 *
 * 它主要用于在 **非 JSX 编译上下文** 或 **普通函数体表达式**
 * 中创建可自动更新的视图区域。
 *
 * 与 `Dynamic` 组件不同：
 *
 * - `Dynamic` 适用于根据 `is` 属性切换组件或标签类型（结构级动态）
 * - `dynamic` 适用于根据响应式表达式结果重建子树（表达式级动态）
 *
 * ---
 *
 * ## 工作机制
 *
 * - 在首次执行时运行 `build` 构建初始子视图
 * - 自动追踪 `build` 内部访问的响应式依赖
 * - 当依赖变更时重新执行 `build`
 * - 对新旧结果进行最小必要更新
 *
 * ---
 *
 * ## 适用场景
 *
 * - 三元表达式返回不同视图
 * - 基于响应式条件切换视图
 * - 在普通函数中构建可自动更新的视图
 *
 * ---
 *
 * ## 示例
 *
 * ```tsx
 * function App() {
 *   const show = ref(true)
 *
 *   return dynamic(() =>
 *     show.value ? <A /> : <B />
 *   )
 * }
 * ```
 *
 * 也可以返回原始类型：
 *
 * ```ts
 * dynamic(() => count.value)
 * ```
 *
 * ---
 *
 * ## 注意事项
 *
 * - `build` 必须是无参数函数
 * - 不应在 `build` 中执行副作用逻辑
 * - 返回值必须满足 `RenderUnit` 类型约束
 *
 * ---
 *
 * @template T - 构建函数返回值类型，必须符合 `RenderUnit`
 * @param build 用于构建子视图的函数。函数内部可访问响应式数据。
 * @returns 返回一个 `DynamicView<T>` 实例
 */
export function dynamic<T extends RenderUnit>(build: () => T): DynamicView<T> {
  return new DynamicView(new DynamicViewSource(build))
}

/**
 * 处理条件渲染表达式
 *
 * @internal
 * @param select - 选择器函数，用于决定执行哪个分支
 * @param branches - 分支函数数组，每个函数返回一个计算值
 * @param location - 代码位置
 * @returns {DynamicView} - 切换视图
 */
export function switchExpressions(
  select: () => number | null,
  branches: (() => unknown)[],
  location?: CodeLocation
): DynamicView {
  return new DynamicView(new SwitchViewSource(select, branches), location)
}

/**
 * 处理成员表达式，根据对象的属性返回相应的值或视图
 *
 * @internal
 * @param obj - 要处理的对象，必须是 object 类型
 * @param key - 对象的属性键，必须是 obj 的键之一
 * @param location - 代码位置
 * @returns 返回属性值或 DynamicView 视图对象
 */
export function memberExpressions<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  location?: CodeLocation
): T[K] | DynamicView<T[K]> {
  // 检查对象是否有属性跟踪
  const { value, isTrack } = hasPropTrack(obj, key)
  // 不需要跟踪直接返回
  if (!isTrack) return value
  // 如果值是函数，则直接返回该函数
  if (isFunction(value)) return value
  const source = key === 'value' && isRef(obj) ? obj : toRef(obj, key)
  return new DynamicView<T[K]>(source, location)
}
