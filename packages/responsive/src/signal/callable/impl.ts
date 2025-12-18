import { IS_SIGNAL } from '../../constants/index.js'
import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { CallableSignal } from '../../types/index.js'

/**
 * 创建函数式 Signal
 *
 * @param value - 初始值
 * @returns {CallableSignal} - 函数式 Signal 对象
 * @example
 * ```ts
 * const count = signal(0)
 * console.log(count()) // 0
 * count(1)
 * console.log(count()) // 1
 * ```
 */
export function signal<T>(value: T): CallableSignal<T> {
  let _value: T = value

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
  Object.defineProperty(sig, IS_SIGNAL, { value: true })
  return sig
}
