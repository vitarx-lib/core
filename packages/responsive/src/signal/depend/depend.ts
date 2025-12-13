import { Context } from '../../context/index.js'
import type { DebuggerEventHandler, DependType } from '../../types/debug.js'
import type { Signal } from '../../types/index.js'
import { triggerOnTrack, triggerOnTrigger } from './debug.js'
import { DEP_LINK_HEAD } from './link.js'

/**
 * 信号依赖集合
 */
export type DepSet = Set<Signal>

/**
 * 上下文中存储依赖的符号
 */
const DEP_CTX = Symbol.for('SIGNAL_DEPENDENCY_CONTEXT')
type DepCollector = {
  add: (dep: Signal) => void
  /**
   * 跟踪信号依赖 - 开发环境有效
   *
   * @param signal - 被跟踪的信号
   * @param type - 调试事件类型
   */
  onTrack?: DebuggerEventHandler
}
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
 * @param type
 */
export function trackSignal(signal: Signal, type: DependType): void {
  const ctx = Context.get<DepCollector>(DEP_CTX)
  if (!ctx) return
  ctx.add(signal)
  if (__DEV__) {
    triggerOnTrack(ctx, signal, type)
  }
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

/**
 * 触发信号的相关函数
 * 该函数用于遍历信号的所有依赖链接，并触发每个观察者的回调函数
 * @param signal - 要触发的信号对象
 * @param type - 依赖类型，用于标识依赖关系的性质
 */
export function triggerSignal(signal: Signal, type: DependType) {
  // 遍历信号的所有依赖链接
  // 从头节点开始，直到链表结束
  for (let link = signal[DEP_LINK_HEAD]; link; link = link.sigNext) {
    const watcher = link.watcher
    if (__DEV__) {
      triggerOnTrigger(watcher, signal, type)
    }
    watcher.trigger()
  }
}
