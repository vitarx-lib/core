import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { Signal, SignalOptions } from '../../types/index.js'
import { IS_SIGNAL, SIGNAL_VALUE } from './symbol.js'

/**
 * FnSignal 函数类型重载：
 * - 无参调用：返回当前值（get）
 * - 有参调用：设置新值（set），返回 void
 */
export interface FnSignal<T = any> extends Signal<T> {
  (): T
  (value: T): void
}

/**
 * 创建函数式 Signal
 *
 * @param initialValue 初始值
 * @param options - 配置选项
 * @param {boolean | SignalOptions['compare']} [options.compare] - 比较函数
 * @returns 兼具 get/set 能力的 Signal 函数
 */
export function signal<T>(initialValue: T, options: SignalOptions = {}): FnSignal<T> {
  const compare = options.compare ?? Object.is
  let _value: T = initialValue

  // 核心 Signal 函数（重载实现）
  const sig = function (newValue?: T): T | void {
    // 无参调用：get 操作，收集依赖 + 返回当前值
    if (arguments.length === 0) {
      trackSignal(sig, 'get')
      return _value
    }

    // 有参调用：set 操作，更新值 + 触发观察者
    if (compare(_value, newValue)) return
    const oldValue = _value
    _value = newValue!
    triggerSignal(sig, 'set', { newValue, oldValue })
  } as FnSignal<T>
  Object.defineProperty(sig, IS_SIGNAL, { value: true })
  Object.defineProperty(sig, SIGNAL_VALUE, { get: sig })
  return sig
}
