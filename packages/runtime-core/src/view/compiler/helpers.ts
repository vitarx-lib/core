import { BranchCompute, TrackedCompute } from './compute.js'

/**
 * 创建一个可追踪的计算值
 * @param getter - 一个返回值的函数，该值将被追踪
 * @returns 如果计算值是静态的，返回计算值本身；否则返回一个 TrackedCompute 对象
 */
export function tracked<T = any>(getter: () => T): TrackedCompute<T> {
  // 判断计算值是否是静态的，如果是则返回计算值，否则返回 TrackedCompute 对象
  return new TrackedCompute<T>(getter)
}

/**
 * 分支计算函数，根据选择器的结果决定执行哪个分支
 *
 * @template T - 泛型类型，表示分支返回值的类型
 * @param select - 选择器函数，返回一个数字，用于决定执行哪个分支
 * @param branches - 分支函数数组，每个函数返回类型为T
 * @returns - 如果分支计算结果是静态的，则返回计算值；否则返回BranchCompute对象
 */
export function branch<T = any>(select: () => number, branches: (() => T)[]): BranchCompute<T> {
  // 判断是否为静态计算，如果是则返回计算值，否则返回计算对象
  return new BranchCompute(select, branches)
}
