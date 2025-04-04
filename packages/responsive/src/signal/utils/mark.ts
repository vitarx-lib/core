import { NOT_SIGNAL_SYMBOL, type NotSignal } from '../core/index'

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
