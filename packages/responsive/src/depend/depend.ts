import { Context } from '../context/index.js'
import type { Signal } from '../types/index.js'

/**
 * 信号依赖集合
 */
export type DepSet = Set<Signal>

/**
 * 上下文中存储依赖的符号
 */
const DEP_CTX = Symbol.for('SIGNAL_DEPENDENCY_CONTEXT')
type DepCollector = { add: (dep: Signal) => void }
/**
 * 依赖收集结果
 * @template T 函数返回值类型
 */
export type CollectResult<T, D> = {
  /**
   * 函数执行结果
   */
  result: T
  /**
   * 收集到的依赖
   *
   * 如果传入了自定义的收集器，则返回的是收集器自身
   */
  deps: D
}

/**
 * 跟踪信号，将信号加入当前上下文的依赖集合
 *
 * @param signal - 被跟踪的响应式信号
 */
export function trackSignal(signal: Signal): void {
  Context.get<DepSet>(DEP_CTX)?.add(signal)
}
/**
 * 运行函数并收集信号依赖
 *
 * @template T 函数返回值类型
 * @param fn - 需要收集依赖的函数
 * @returns {CollectResult<T, DepSet>} 函数执行结果
 */
export function collectSignal<T>(fn: () => T): CollectResult<T, DepSet>
/**
 * 运行函数并收集依赖 - 自定义收集器
 *
 * @template T 函数返回值类型
 * @template C 收集器类型，必须带有add方法
 * @param fn - 需要收集依赖的函数
 * @param collector - 自定义收集器
 * @returns {CollectResult<T, C>} 函数执行结果
 */
export function collectSignal<T, C extends DepCollector>(
  fn: () => T,
  collector: C
): CollectResult<T, C>
/**
 * 收集函数执行过程中的信号依赖
 *
 * @template T 函数返回值类型
 * @template D 依赖收集器类型
 * @param fn - 需要依赖收集的函数
 * @param collector - 收集器
 * @returns {CollectResult<T, D>} 包含函数执行结果和依赖集合
 */
export function collectSignal<T, D extends DepCollector | DepSet>(
  fn: () => T,
  collector?: D
): CollectResult<T, D extends undefined ? DepSet : D> {
  const ctx = collector || new Set<Signal>()
  const result = Context.run(DEP_CTX, ctx, fn)
  return { result, deps: ctx } as CollectResult<T, D extends undefined ? DepSet : D>
}
