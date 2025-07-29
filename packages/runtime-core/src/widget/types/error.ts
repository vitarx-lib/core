import type { Widget } from '../core/index'
import type { LifecycleHookNames } from './lifecycle'

/**
 * 错误来源联合类型
 */
export type ErrorSource =
  | 'build'
  | 'render'
  | 'update'
  | `effect.${string}`
  | `hook:${Exclude<LifecycleHookNames, 'error'>}`

/**
 * 错误信息对象接口
 */
export interface ErrorInfo {
  /**
   * 错误来源
   */
  source: ErrorSource
  /**
   * 抛出异常的实例
   */
  instance: Widget
}
