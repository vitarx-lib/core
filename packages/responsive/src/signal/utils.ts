import {
  DEEP_SIGNAL_SYMBOL,
  NOT_SIGNAL_SYMBOL,
  PROXY_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  SIGNAL_SYMBOL
} from './constants'
import type { BaseSignal, NotSignal, ProxySignal, RefSignal } from './types'

/**
 * 检查一个值是否为响应式信号。信号是一个具有特殊标识符的响应式数据容器。
 *
 * @param { any } val - 待检测的值，可以是任意类型
 * @returns { boolean } - 如果值具有信号标识符（SIGNAL_SYMBOL为true），则返回true，否则返回false
 * @example
 * ```ts
 * const refSignal = ref(1);
 * const proxySignal = reactive({});
 * console.log(isSignal(signal)); // true
 * console.log(isSignal(1)); // false
 * console.log(isSignal(proxySignal)); // true
 * console.log(isSignal({})); // true
 * ```
 */
export function isSignal(val: any): val is BaseSignal {
  return val?.[SIGNAL_SYMBOL] === true
}

/**
 * 检查一个值是否为引用类型信号（RefSignal）。引用信号是一个包装了原始值的响应式引用。
 *
 * @param { any } val - 待检测的变量，可以是任意类型
 * @returns { boolean } - 如果值同时具有信号标识符（SIGNAL_SYMBOL）和引用信号标识符（REF_SIGNAL_SYMBOL），则返回true，否则返回false
 * @example
 * ```ts
 * const refSignal = ref(1);
 * const proxySignal = reactive({});
 * console.log(isRefSignal(refSignal)); // true
 * console.log(isRefSignal(proxySignal)); // false
 * ```
 */
export function isRefSignal(val: any): val is RefSignal {
  return val?.[SIGNAL_SYMBOL] === true && val?.[REF_SIGNAL_SYMBOL] === true
}

/**
 * 检查一个值是否为代理对象信号（ProxySignal）。
 *
 * 代理信号是通过Proxy包装的响应式对象。
 *
 * @param { any } val - 待检测的变量，可以是任意类型
 * @returns { boolean } - 如果值同时具有信号标识符（SIGNAL_SYMBOL）和代理信号标识符（PROXY_SIGNAL_SYMBOL），则返回true，否则返回false
 * @alias isProxy - 为了兼容Vue API而提供的别名
 * @example
 * ```ts
 * const proxySignal = reactive({});
 * const refSignal = ref(1);
 * console.log(isProxySignal(proxySignal)); // true
 * console.log(isProxySignal(refSignal)); // false
 * ```
 */
export function isProxySignal(val: any): val is ProxySignal {
  return val?.[SIGNAL_SYMBOL] === true && val?.[PROXY_SIGNAL_SYMBOL] === true
}

export { isProxySignal as isProxy }

/**
 * 检查一个信号是否为深度响应式。
 *
 * 深度信号会递归地将其所有嵌套属性都转换为响应式。
 *
 * @param { BaseSignal } val - 待检测的信号对象
 * @returns { boolean } - 如果信号具有深度标识符（DEEP_SIGNAL_SYMBOL），则返回true，否则返回false
 * @example
 * ```ts
 * const deepSignal = ref({ nested: { value: 1 } });
 * const shallowSignal = shallowRef({ nested: { value: 1 } });
 * console.log(isDeepSignal(deepSignal)); // true
 * console.log(isDeepSignal(shallowSignal)); // false
 * ```
 */
export function isDeepSignal(val: BaseSignal): boolean {
  return Reflect.get(val, DEEP_SIGNAL_SYMBOL)
}

/**
 * 将一个对象标记为永远不会被转换为响应式信号。
 *
 * 这在某些情况下很有用，比如当对象包含原型方法或不应该是响应式的时候。
 *
 * @alias markRaw - 为了兼容Vue API而提供的别名
 * @template T - 待标记的对象类型
 * @param { AnyObject } obj - 待标记的对象，必须是一个非null的对象
 * @returns { NotSignal<T> } - 返回被标记为非信号的对象
 * @throws { TypeError } - 如果传入的参数不是对象类型（比如null、undefined、数字等），则抛出类型错误
 * @example
 * ```ts
 * const obj = { value: 1 };
 * const rawObj = markNotSignal(obj);
 * const signal = reactive(rawObj); // rawObj不会被转换为响应式
 * console.log(isSignal(signal)); // false
 * ```
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
 * 检查一个对象是否被标记为非信号对象。
 *
 * 被标记的对象将不会被转换为响应式信号。
 *
 * @param { AnyObject } obj - 待检查的对象
 * @returns { boolean } - 如果对象具有非信号标识符（NOT_SIGNAL_SYMBOL），则返回true，否则返回false
 * @alias isMarkRaw - 为了兼容Vue API而提供的别名
 * @example
 * ```ts
 * const obj = { value: 1 };
 * const rawObj = markNotSignal(obj);
 * console.log(isMarkNotSignal(rawObj)); // true
 * console.log(isMarkNotSignal(obj)); // false
 * ```
 */
export function isMarkNotSignal(obj: AnyObject): boolean {
  return !!(obj as any)[NOT_SIGNAL_SYMBOL]
}

export { isMarkNotSignal as isMarkRaw }
