import { SIGNAL_SYMBOL, SIGNAL_VALUE } from '../../constants/index.js'
import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { Signal } from '../../types/index.js'

/**
 * CallableSignal 函数类型重载：
 * - 无参调用：返回当前值（get）
 * - 有参调用：设置新值（set），返回 void
 */
export interface CallableSignal<T = any> extends Signal<T> {
  (): T
  (value: T): void
}

/**
 * 创建函数式 Signal
 *
 * @param initialValue 初始值
 * @returns {CallableSignal} - 函数式 Signal 对象
 */
export function signal<T>(initialValue: T): CallableSignal<T> {
  let _value: T = initialValue

  // 核心 Signal 函数（重载实现）
  const sig = function (newValue?: T): T | void {
    // 无参调用：get 操作，收集依赖 + 返回当前值
    if (arguments.length === 0) {
      trackSignal(sig, 'get')
      return _value
    }

    // 有参调用：set 操作，更新值 + 触发观察者
    if (Object.is(_value, newValue)) return
    const oldValue = _value
    _value = newValue!
    triggerSignal(sig, 'set', { newValue, oldValue })
  } as CallableSignal<T>
  Object.defineProperty(sig, SIGNAL_SYMBOL, { value: true })
  Object.defineProperty(sig, SIGNAL_VALUE, { get: sig })
  return sig
}
