import { type AllPropertiesSymbol, ObserverManager, type SubscriptionOptions } from './manager'
import { Subscriber } from './subscriber'

/**
 * ## 触发变更通知
 *
 * 通知订阅者目标对象的指定属性已变更。当响应式对象的属性发生变化时，
 * 调用此函数可以手动触发通知机制，使所有订阅该属性的订阅者收到更新。
 *
 * @template T - 目标对象的类型
 * @template P - 目标对象的属性键类型
 * @param {T} target - 变更的目标对象
 * @param {P|P[]} property - 变更的属性名或属性名数组
 * @returns {void} 无返回值
 * @example
 * const user = { name: 'John', age: 30 }
 * notify(user, 'name') // 通知name属性已变更
 * notify(user, ['name', 'age']) // 通知多个属性已变更
 */
export function notify<T extends AnyObject, P extends keyof T>(target: T, property: P | P[]): void {
  ObserverManager.notify(target, property)
}

/**
 * ## 订阅对象属性变更
 *
 * 创建一个订阅，监听指定对象的属性变更。当目标对象的属性发生变化时，
 * 会触发提供的回调函数。此函数是响应式系统的核心API之一，用于建立
 * 对象属性与副作用之间的关联。
 *
 * @template T - 目标对象的类型
 * @template C - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {C|Subscriber<C>} callback - 回调函数或已存在的订阅者实例
 * @param {keyof T|AllPropertiesSymbol} [property=ObserverManager.ALL_PROPERTIES_SYMBOL] - 要监听的属性名，默认为监听所有属性变更
 * @param {SubscriptionOptions} [options] - 订阅选项
 * @param {boolean} [options.batch=true] - 是否使用批处理模式，为true时会合并短时间内的多次通知
 * @param {number} [options.limit=0] - 触发次数限制，0表示无限制，大于0时会在触发指定次数后自动取消订阅
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，为true时会随当前作用域销毁而自动取消订阅
 * @returns {Subscriber<C>} 返回订阅者实例，可用于手动取消订阅
 * @example
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribe(user, (target, prop) => {
 *   console.log(`属性 ${String(prop)} 已变更`)
 * }, 'name')
 * // 取消订阅
 * subscriber.dispose()
 */
export function subscribe<T extends AnyObject, C extends AnyCallback>(
  target: T,
  callback: C | Subscriber<C>,
  property?: keyof T | AllPropertiesSymbol,
  options?: SubscriptionOptions
): Subscriber<C> {
  return ObserverManager.subscribe(target, callback, property, options)
}
