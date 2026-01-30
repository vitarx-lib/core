import type { View } from '../../types/index.js'
import { SwitchView } from '../view/switch.js'
import { BranchTracker, ExprTracker } from './tracker.js'

/**
 * 创建一个可追踪的计算值
 *
 * `tracked` 和 `computed` 几乎一致，
 * 支持通过 `isStatic` 判断是否为静态值。
 *
 * @internal - 编译器使用
 * @param getter - 一个返回值的函数，该值将被追踪
 * @returns {ExprTracker} 返回一个 TrackedCompute 对象
 */
export function tracked<T = any>(getter: () => T): ExprTracker<T> {
  return new ExprTracker<T>(getter)
}

/**
 * 分支计算函数，根据选择器的值执行不同的分支计算
 *
 * @internal - 编译器使用
 * @template T - 返回值的类型，默认为 any
 * @param {() => number} select - 选择器函数，用于决定执行哪个分支
 * @param {(() => T)[]} branches - 分支函数数组，每个函数返回一个计算值
 * @returns {BranchTracker<T>} - 返回一个分支计算对象
 */
export function branch<T = any>(select: () => number, branches: (() => T)[]): BranchTracker<T> {
  return new BranchTracker(select, branches)
}

/**
 * 构建视图的辅助函数
 *
 * 如果传入的函数中有信号依赖，则会构建为一个动态视图
 *
 * @example
 *
 * @param build - 一个无参数返回View的函数，用于构建视图。
 * @returns { View } 返回构建好的视图，可能是静态视图也可能是动态视图
 */
export function build(build: () => View): View {
  // 创建一个TrackedCompute实例，传入构建函数
  const trackedCompute = new ExprTracker<View>(build)
  // 判断如果是静态视图，直接返回计算值；否则创建动态视图
  return trackedCompute.isStatic ? trackedCompute.value : new SwitchView(trackedCompute)
}
