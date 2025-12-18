import { IS_SIGNAL } from '../../constants/index.js'
import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { CallableSignal } from '../../types/index.js'

/**
 * 创建函数式 Signal（无参数重载）
 *
 * 创建一个未初始化的函数式 Signal，初始值为 undefined。
 *
 * @returns {CallableSignal<any>} 返回一个未初始化的函数式 Signal
 *
 * @example
 * ```ts
 * const count = signal() // CallableSignal<any>
 * console.log(count()) // undefined
 * count(1)
 * console.log(count()) // 1
 * ```
 */
export function signal(): CallableSignal

/**
 * 创建函数式 Signal（泛型重载）
 *
 * 创建一个指定类型的函数式 Signal，初始值为 undefined。
 *
 * @template T - Signal 值的类型
 * @returns {CallableSignal<T | undefined>} 返回指定类型的函数式 Signal
 *
 * @example
 * ```ts
 * const count = signal<number>() // CallableSignal<number | undefined>
 * console.log(count()) // undefined
 * count(1)
 * console.log(count()) // 1
 * ```
 */
export function signal<T>(): CallableSignal<T | undefined>

/**
 * 创建函数式 Signal（带初始值重载）
 *
 * 创建一个带有初始值的函数式 Signal。函数式 Signal 可以通过函数调用的方式
 * 获取或设置值：无参调用获取值，传参调用设置值。
 *
 * @template T - Signal 值的类型
 * @param value - 初始值
 * @returns {CallableSignal<T>} 返回带有初始值的函数式 Signal
 *
 * @example
 * ```ts
 * const count = signal(0) // CallableSignal<number>
 * console.log(count()) // 0 - 获取值
 * count(1) // 设置值
 * console.log(count()) // 1 - 获取值
 *
 * const user = signal({ name: 'John' }) // CallableSignal<{ name: string }>
 * console.log(user().name) // 'John' - 获取值
 * user({ name: 'Jane' }) // 设置值
 * console.log(user().name) // 'Jane' - 获取值
 * ```
 */
export function signal<T>(value: T): CallableSignal<T>

/**
 * 创建函数式 Signal 的实现函数
 *
 * 函数式 Signal 是一种特殊的信号，可以通过函数调用的方式来获取或设置值。
 * 这种设计使得 Signal 在使用上更加灵活和直观。
 *
 * @param value - 初始值
 * @returns {CallableSignal} 返回函数式 Signal 对象
 */
export function signal(value?: any): CallableSignal {
  let _value: any = value

  // 核心 Signal 函数（重载实现）
  const sig = function (newValue?: any): any | void {
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
  } as CallableSignal

  // 为函数对象添加 Signal 标识
  Object.defineProperty(sig, IS_SIGNAL, { value: true })
  return sig
}
