import { REF_SIGNAL_SYMBOL } from '../constants'
import type { BaseSignal } from './base'

/**
 * 引用信号的接口
 */
export interface RefSignal<Value = any, RAW = Value> extends BaseSignal<RAW> {
  readonly [REF_SIGNAL_SYMBOL]: true

  /**
   * 获取信号的当前值
   */
  get value(): Value

  /**
   * 设置信号的新值
   */
  set value(newValue: Value)
}
