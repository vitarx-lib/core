import { logger } from '@vitarx/utils'
import type { EffectHandle, Signal } from './dep.js'

export type SignalOpType = keyof ProxyHandler<any> | string
export interface ExtraDebugData {
  /** 变更前的值，仅在触发阶段可选 */
  oldValue?: any
  /** 变更后的值，仅在触发阶段可选 */
  newValue?: any
  /**
   * 其他信号自定义发出的信息
   */
  [key: string]: any
}
export interface DebuggerOptions {
  /**
   * trigger调试钩子 - 触发信号
   *
   * 当信号值发生变化并触发依赖更新时调用此钩子函数。
   * 可用于调试和监控依赖系统的运行状态。
   *
   * @param event - 调试事件对象，包含触发相关的调试信息
   */
  onTrigger?: DebuggerHandler
  /**
   * track调试钩子 - 跟踪信号
   *
   * 当响应式系统跟踪到新的依赖关系时调用此钩子函数。
   * 可用于调试和监控依赖收集的过程。
   *
   * @param event - 调试事件对象，包含跟踪相关的调试信息
   */
  onTrack?: DebuggerHandler
}
export interface DebuggerEvent extends ExtraDebugData {
  /**
   * 信号来源
   */
  signal: Signal
  /**
   * 副作用对象（通常是Watcher派生类实例）
   */
  effect: EffectHandle
  /**
   * 触发类型
   *
   * - get: 获取信号值
   * - set: 设置信号值
   * - 其他类型：如 add, delete, has, ownKeys 等
   */
  type: SignalOpType
}
export type DebuggerHandler = (event: DebuggerEvent) => void

/**
 * 调试追踪器
 *
 * @param event
 */
export function triggerOnTrack(event: DebuggerEvent) {
  try {
    const debugHandler = event.effect.onTrack
    if (typeof debugHandler === 'function') debugHandler(event)
  } catch (e) {
    logger.debug(`[triggerOnTrack] Error in onTrack:`, e)
  }
}

/**
 * 调试触发器
 *
 * @param event
 */
export function triggerOnTrigger(event: DebuggerEvent) {
  try {
    const debugHandler = event.effect.onTrigger
    if (typeof debugHandler === 'function') debugHandler(event)
  } catch (e) {
    logger.debug(`[triggerOnTrigger] Error in onTrigger:`, e)
  }
}

/**
 * 绑定调试钩子的函数
 * @param effect - 响应式效果的句柄
 * @param debuggerOptions - 调试器的钩子对象，包含onTrack和onTrigger方法
 */
export function bindDebuggerOptions(effect: EffectHandle, debuggerOptions: DebuggerOptions): void {
  // 仅在开发环境下执行调试钩子的绑定
  if (__DEV__) {
    // 当追踪依赖时调用调试钩子的onTrack方法
    effect.onTrack = debuggerOptions.onTrack
    // 当触发依赖时调用调试钩子的onTrigger方法
    effect.onTrigger = debuggerOptions.onTrigger
  }
}
