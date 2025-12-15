import type { Signal } from './signal/index.js'
import type { DepEffect } from './Watcher.js'

export type SignalOpType = keyof ProxyHandler<any> | string
export interface DebuggerEventOptions {
  /** 变更前的值，仅在触发阶段可选 */
  oldValue?: any
  /** 变更后的值，仅在触发阶段可选 */
  newValue?: any
  /**
   * 其他信号自定义发出的信息
   */
  [key: string]: any
}
export interface DebuggerEvent extends DebuggerEventOptions {
  /**
   * 信号来源
   */
  signal: Signal
  /**
   * 副作用对象（通常是Watcher派生类实例）
   */
  effect: DepEffect
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
