import { logger } from '@vitarx/utils'
import type { DepEffectLike, Signal } from './dep.js'

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
export interface DebuggerEvent extends ExtraDebugData {
  /**
   * 信号来源
   */
  signal: Signal
  /**
   * 副作用对象（通常是Watcher派生类实例）
   */
  effect: DepEffectLike
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
