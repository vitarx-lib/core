import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { Signal, SignalOptions } from '../../types/index.js'
import { IS_SIGNAL, SIGNAL_RAW_VALUE, SIGNAL_READ_VALUE } from './symbol.js'

/**
 * 函数式 signal 访问（用于 readFnSignal 读取值，需触发跟踪）
 */
const IS_FN_SIGNAL = Symbol.for('__v_is-fn-signal')
/**
 * FnSignal 函数类型重载：
 * - 无参调用：返回当前值（get）
 * - 有参调用：设置新值（set），返回 void
 */
export type FnSignal<T = any> = {
  (): T
  (value: T): void
} & Signal<T>

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
  const sig = ((newValue?: T): T | void => {
    // 无参调用：get 操作，收集依赖 + 返回当前值
    if (arguments.length === 0) {
      trackSignal(sig, 'get')
      return _value
    }

    // 有参调用：set 操作，更新值 + 触发观察者
    if (compare(_value, newValue)) return
    _value = newValue!
    triggerSignal(sig, 'set')
  }) as FnSignal<T>
  Object.defineProperty(sig, IS_SIGNAL, { value: true })
  Object.defineProperty(sig, SIGNAL_RAW_VALUE, { get: () => _value })
  Object.defineProperty(sig, SIGNAL_READ_VALUE, { get: () => sig() })
  Object.defineProperty(sig, IS_FN_SIGNAL, { value: true })
  return sig
}

/**
 * 判断一个值是否为函数信号(FnSignal)类型
 *
 * @param val - 需要检查的值
 * @returns {boolean} 如果值是FnSignal类型返回true，否则返回false
 */
export function isFnSignal(val: any): val is FnSignal {
  // 双重非运算确保val为真，并且检查IS_FN_SIGNAL属性是否存在
  return !!val && !!val[IS_FN_SIGNAL]
}
