import type { AnyCollection } from '@vitarx/utils'
import type { CollectionSignal } from '../../types/signal/collection.js'
import { MapProxy, WeakMapProxy } from './map.js'
import { SetProxy, WeakSetProxy } from './set.js'

/**
 * 将集合类型转换为响应式的集合代理
 *
 * @param collection - 需要转换的集合，可以是Set、Map、WeakSet或WeakMap
 * @returns {CollectionSignal} 返回一个响应式的集合代理对象
 * @throws {TypeError} 如果传入的参数不是集合类型，则抛出错误
 */
export function collection<T extends AnyCollection>(collection: T): CollectionSignal<T> {
  // 如果传入的是Map类型，则使用MapProxyHandler创建代理
  if (collection instanceof Map) {
    return new MapProxy(collection).proxy
  }
  // 如果传入的是Set类型，则使用SetProxyHandler创建代理
  if (collection instanceof Set) {
    return new SetProxy(collection).proxy
  }
  // 如果传入的是WeakSet类型，则使用WeakSetProxyHandler创建代理
  if (collection instanceof WeakSet) {
    return new WeakSetProxy(collection).proxy
  }
  // 如果传入的是WeakMap类型，则使用WeakMapProxyHandler创建代理
  if (collection instanceof WeakMap) {
    return new WeakMapProxy(collection).proxy
  }
  // 如果传入的不是任何集合类型，抛出错误
  throw new TypeError(`[collection()] ${collection} is not a collection`)
}
