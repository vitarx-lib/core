import { hasPropTrack, IS_REF, isRef, type Ref } from '@vitarx/responsive'
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
 * - 执行更新（仅原始类型的值）或替换视图操作
 *
 * @template T - 构建函数返回值类型，必须符合 `RenderUnit`
 * @param build 用于构建子视图的函数。函数内部可访问响应式数据。
 * @param [location] - 代码位置信息，用于调试
 * @returns 返回一个 `DynamicView<T>` 实例
 * @example
 * ```jsx
 * function App() {
 *   const show = ref(true)
 *
 *   return dynamic(() =>
 *     show.value ? <A /> : <B />
 *   )
 *   // 也可以返回原始类型
 *   // dynamic(() => count.value)
 * }
 * ```
 */
export function dynamic<T extends RenderUnit>(
  build: () => T,
  location?: CodeLocation
): DynamicView<T> {
  return new DynamicView(new DynamicViewSource(build), location)
}

/**
 * 创建一个switch分支表达式级别的动态视图
 *
 * ## 工作机制
 *
 * - 在首次执行时运行 `select` 选择器函数，决定执行哪个分支
 * - 运行对应的分支函数，构建子视图
 * - 当依赖变更时重新执行 `select`，并重新运行对应的分支函数
 * - 执行更新（仅原始类型的值）或替换视图操作
 *
 * @param select - 选择器函数，用于决定执行哪个分支
 * @param branches - 分支函数数组，每个函数返回一个 `RenderUnit`
 * @param [location] - 代码位置信息，用于调试
 * @returns {DynamicView} - 动态视图
 * @example
 * ```
 * const cond = ref('a')
 * const select = () => {
 *  if(cond.value === 'a') return 0
 *  if(cond.value === 'b') return 1
 *  return null
 * }
 * const branches = [() => 'branch a', () => 'branch b']
 * const view = branch(select, branches)
 * ```
 */
export function branch(
  select: () => number | null,
  branches: (() => unknown)[],
  location?: CodeLocation
): DynamicView {
  return new DynamicView(new SwitchViewSource(select, branches), location)
}

/**
 * 访问对象的属性，如果属性是响应式则返回 Ref
 *
 * 主要用途是使传递的 `reactive[key]` child 保持响应式。
 *
 * ## 工作机制
 * - 访问对象成员属性
 * - 如果支持跟踪则返回 Ref
 * - 否则返回属性值
 *
 * @param obj - 要处理的对象，必须是 object 类型
 * @param key - 对象的属性键，必须是 obj 的键之一
 * @returns {unknown} - 返回属性值 或 Ref
 * @example
 * ```jsx
 * const data = reactive({ a: 1 })
 *
 * createElement('div', {children: access(data, 'a') // children: Ref<1>})
 * createElement('div', {children: access({a:1}, 'a') // children: 1})
 * ```
 */
export function access<T extends object, K extends keyof T>(
  obj: T,
  key: K
): T[K] | Ref<T[K], never> {
  // 检查对象是否有属性跟踪
  const { value, isTrack } = hasPropTrack(obj, key)
  // 不需要跟踪直接返回
  if (!isTrack) return value
  if (isRef(value)) return value
  return key === 'value' && isRef(obj)
    ? obj
    : {
        [IS_REF]: true,
        get value(): T[K] {
          return obj[key]
        }
      }
}
