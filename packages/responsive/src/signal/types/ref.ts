import { REF_SIGNAL_SYMBOL } from '../constants.js'
import type { BaseSignal } from './base.js'

/**
 * 引用信号的接口
 *
 * @template Value - 信号的值类型
 * @template Raw - 信号的原始值类型，默认为Value类型
 */
export interface RefSignal<Value = any, Raw = Value> extends BaseSignal<Raw> {
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
