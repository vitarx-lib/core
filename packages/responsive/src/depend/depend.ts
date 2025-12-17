import { SIGNAL_DEP_HEAD } from '../constants/index.js'
import { Context } from '../context/index.js'
import type { DebuggerEventOptions, SignalOpType } from '../types/debug.js'
import type { DepEffect, Signal } from '../types/index.js'
import { triggerOnTrack, triggerOnTrigger } from './debug.js'
import { clearEffectDeps, createDepLink } from './link.js'

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
  effect: DepEffect | undefined
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
 * 运行函数并收集依赖并构建双向依赖关系
 *
 * 在关联之前，会先清空依赖关系，无需外部额外清理。
 *
 * @template T 函数返回值类型
 * @template C 收集器类型，必须带有add方法
 * @param fn - 需要收集依赖的函数
 * @param effect - 副作用对象，自动建立依赖关系
 * @returns {CollectResult<T>} 函数执行结果
 */
export function collectSignal<T, C extends DepEffect>(fn: () => T, effect: C): CollectResult<T>
/**
 * 收集函数执行过程中的信号依赖
 *
 * @template T 函数返回值类型
 * @param fn - 需要依赖收集的函数
 * @param effect - 副作用对象，自动建立依赖关系
 * @returns {CollectResult<T>} 包含函数执行结果和依赖集合
 */
export function collectSignal<T>(fn: () => T, effect?: DepEffect): CollectResult<T> {
  const deps = new Set<Signal>()
  const ctx: CollectContext = { deps, effect }
  const result = Context.run(DEP_CONTEXT, ctx, fn)
  if (effect) {
    clearEffectDeps(effect)
    for (const dep of deps) {
      createDepLink(effect, dep)
    }
  }
  return { result, deps }
}
/**
 * trackSignal 仅在 collectSignal 的上下文中生效，
 * 它只记录 signal，真正建立 DepLink 的操作在 collectSignal fn 执行后完成。
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
    const effect = ctx.effect
    if (effect) triggerOnTrack({ ...options, effect, signal, type })
  }
}
/**
 * 触发信号的助手函数
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
  for (let link = signal[SIGNAL_DEP_HEAD]; link; ) {
    const next = link.sigNext
    const effect = link.effect
    if (__DEV__) {
      triggerOnTrigger({ ...options, effect, signal, type })
    }
    effect.schedule()
    link = next
  }
}
