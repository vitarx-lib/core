import { Subscriber } from './subscriber'
import { ObserverManager, type SubscriptionOptions } from './manager'

/**
 * ## 触发变更通知
 *
 * 通知订阅者目标对象的指定属性已变更
 *
 * @param {AnyObject} target - 变更的目标对象
 * @param {AnyKey|AnyKey[]} property - 变更的属性名或属性名数组
 */
export function notify<T extends AnyObject, P extends AnyKey>(target: T, property: P | P[]): void {
  ObserverManager.notify(target, property)
}

/**
 * ## 订阅对象属性变更
 *
 * @param {AnyObject} target - 目标对象
 * @param {AnyCallback|Subscriber} callback - 回调函数或订阅者实例
 * @param {AnyKey} property - 属性名，默认为全局变更
 * @param {SubscriptionOptions} options - 订阅选项
 * @returns {Subscriber} - 订阅者实例
 */
export function subscribe<T extends AnyObject, C extends AnyCallback>(
  target: T,
  callback: C | Subscriber<C>,
  property?: AnyKey,
  options?: SubscriptionOptions
): Subscriber<C> {
  return ObserverManager.subscribe(target, callback, property, options)
}
