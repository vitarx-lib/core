import { Context } from '../context/index.js'
import type { DebuggerEventOptions, SignalOpType } from '../types/debug.js'
import type { DepEffect, Signal } from '../types/index.js'
import { triggerOnTrack, triggerOnTrigger } from './debug.js'
import { DEP_LINK_HEAD, linkSignalEffect } from './link.js'

/**
 * 信号依赖集合
 */
export type DepSet = Set<Signal>

/**
 * 上下文中存储依赖的符号
 */
const DEP_CONTEXT = Symbol.for('SIGNAL_DEPENDENCY_CONTEXT')
/**
 * 依赖收集结果
 * @template T 函数返回值类型
 */
export type CollectResult<T> = {
  /**
   * 函数执行结果
   */
  result: T
  /**
   * 收集到的依赖
   *
   * 如果传入了自定义的收集器，则返回的是收集器自身
   */
  deps: DepSet
}
interface CollectContext {
  deps: DepSet
  watcher: DepEffect | undefined
}

/**
 * 运行函数并收集信号依赖
 *
 * @template T 函数返回值类型
 * @param fn - 需要收集依赖的函数
 * @returns {CollectResult<T, DepSet>} 函数执行结果
 */
export function collectSignal<T>(fn: () => T): CollectResult<T>
/**
 * 运行函数并收集依赖和构建双向依赖关系
 *
 * @template T 函数返回值类型
 * @template C 收集器类型，必须带有add方法
 * @param fn - 需要收集依赖的函数
 * @param watcher - 观察者对象，自动建立依赖关系
 * @returns {CollectResult<T>} 函数执行结果
 */
export function collectSignal<T, C extends DepEffect>(fn: () => T, watcher: C): CollectResult<T>
/**
 * 收集函数执行过程中的信号依赖
 *
 * @template T 函数返回值类型
 * @param fn - 需要依赖收集的函数
 * @param watcher - 观察者对象，自动建立依赖关系
 * @returns {CollectResult<T>} 包含函数执行结果和依赖集合
 */
export function collectSignal<T>(fn: () => T, watcher?: DepEffect): CollectResult<T> {
  const deps = new Set<Signal>()
  const ctx: CollectContext = { deps, watcher }
  const result = Context.run(DEP_CONTEXT, ctx, fn)
  if (watcher) {
    for (const dep of deps) {
      linkSignalEffect(watcher, dep)
    }
  }
  return { result, deps }
}
/**
 * 跟踪信号，将信号加入当前上下文的依赖集合
 *
 * @param signal - 被跟踪的响应式信号
 * @param type - 跟踪信号的类型，仅供调试使用
 * @param options - 调试选项，仅供调试使用
 */
export function trackSignal(
  signal: Signal,
  type: SignalOpType = 'get',
  options?: DebuggerEventOptions
): void {
  const ctx = Context.get<CollectContext>(DEP_CONTEXT)
  if (!ctx || ctx.deps.has(signal)) return
  ctx.deps.add(signal)
  if (__DEV__) {
    if (ctx.watcher) triggerOnTrack({ effect: ctx.watcher, signal, type, ...options })
  }
}
/**
 * 触发信号的相关函数
 * 该函数用于遍历信号的所有依赖链接，并触发每个观察者的回调函数
 * @param signal - 要触发的信号对象
 * @param type - 依赖类型，用于标识依赖关系的性质
 * @param options - 调试选项，仅供调试使用
 */
export function triggerSignal(
  signal: Signal,
  type: SignalOpType = 'set',
  options?: DebuggerEventOptions
) {
  // 遍历信号的所有依赖链接
  // 从头节点开始，直到链表结束
  for (let link = signal[DEP_LINK_HEAD]; link; link = link.sigNext) {
    const watcher = link.effect
    if (__DEV__) {
      if (watcher) triggerOnTrigger({ effect: watcher, signal, type, ...options })
    }
    watcher.schedule()
  }
}
