import {
  DEEP_SIGNAL_SYMBOL,
  NOT_SIGNAL_SYMBOL,
  PROXY_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  SIGNAL_SYMBOL
} from './constants'
import type { BaseSignal, NotSignal, ProxySignal, RefSignal } from './types'

/**
 * 是否为信号
 *
 * @param { any } val - 待检测的值
 * @returns { boolean } - 如果具有信号标识符，则返回true，否则返回false
 */
export function isSignal(val: any): val is BaseSignal {
  return val?.[SIGNAL_SYMBOL] === true
}

/**
 * 是否为值信号
 *
 * @param { any } val - 待检测的变量
 * @returns { boolean } - 如果具有值信号标识符，则返回true，否则返回false
 */
export function isRefSignal(val: any): val is RefSignal {
  return val?.[SIGNAL_SYMBOL] === true && val?.[REF_SIGNAL_SYMBOL] === true
}

/**
 * 是否为代理对象信号
 *
 * @param { any } val - 待检测的变量
 * @returns { boolean } - 如果具有对象信号标识符，则返回true，否则返回false
 * @alias isProxy 兼容 `Vue` api
 */
export function isProxySignal(val: any): val is ProxySignal {
  return val?.[SIGNAL_SYMBOL] === true && val?.[PROXY_SIGNAL_SYMBOL] === true
}

export { isProxySignal as isProxy }

/**
 * 是否为深度信号
 *
 * @param { BaseSignal } val - 待检测的信号
 * @returns { boolean } - 如果具有深度信号标识符，则返回true，否则返回false
 */
export function isDeepSignal(val: BaseSignal): boolean {
  return Reflect.get(val, DEEP_SIGNAL_SYMBOL)
}

/**
 * 标记为非信号对象
 *
 * @alias markRaw 兼容 `Vue` api
 * @template T - 待标记的对象类型
 * @param { AnyObject } obj - 待标记的对象
 * @returns { NotSignal<T> } - 返回标记后的对象
 * @throws { TypeError } - 如果参数1不是对象类型，则抛出类型错误
 */
export function markNotSignal<T extends AnyObject>(obj: T): NotSignal<T> {
  if (typeof obj !== 'object' || obj === null) {
    throw new TypeError('[Vitarx.markNotSignal]: The argument must be an object type')
  }
  Object.defineProperty(obj, NOT_SIGNAL_SYMBOL, {
    value: true
  })
  return obj as NotSignal<T>
}

export { markNotSignal as markRaw }

/**
 * 判断是否标记为非信号对象
 *
 * @param { AnyObject } obj - 待判断的对象
 * @returns {boolean} - true表示标记为非信号对象
 * @alias isMarkRaw 兼容 `Vue` api
 */
export function isMarkNotSignal(obj: AnyObject): boolean {
  return !!(obj as any)[NOT_SIGNAL_SYMBOL]
}

export { isMarkNotSignal as isMarkRaw }
