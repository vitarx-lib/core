import { ObserverManager, type SubscriptionOptions } from './manager'
import { Subscriber } from './subscriber'

/**
 * ## 触发变更通知
 *
 * 通知订阅者目标对象的指定属性已变更。当响应式对象的属性发生变化时，
 * 调用此函数可以手动触发通知机制，使所有订阅该属性的订阅者收到更新。
 *
 * @alias trigger
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

export { notify as trigger }

/**
 * ## 订阅对象变化
 *
 * 创建一个订阅，监听指定对象变化，并触发回调函数。
 *
 * @template T - 目标对象的类型
 * @template C - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {C|Subscriber<C>} callback - 回调函数或已存在的订阅者实例
 * @param {SubscriptionOptions} [options] - 订阅选项
 * @param {boolean} [options.batch=true] - 是否使用批处理模式，为true时会合并短时间内的多次通知
 * @param {number} [options.limit=0] - 触发次数限制，0表示无限制，大于0时会在触发指定次数后自动取消订阅
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，为true时会随当前作用域销毁而自动取消订阅
 * @returns {Subscriber<C>} 返回订阅者实例，可用于手动取消订阅
 * @example
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribe(user, (props,target) => {
 *   console.log(`属性 ${props.join(',')} 的值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 */
export function subscribe<T extends AnyObject, C extends AnyCallback>(
  target: T,
  callback: C | Subscriber<C>,
  options?: SubscriptionOptions
): Subscriber<C> {
  return ObserverManager.subscribe(target, callback, options)
}

/**
 * ## 同时订阅多个对象
 *
 * 为多个目标对象注册相同的订阅者，当任何一个对象发生变更时触发回调。
 * 返回的订阅者实例可用于统一管理所有订阅。
 *
 * @template T - 目标对象的类型
 * @template CB - 回调函数的类型
 * @param {Set<T>|T[]} targets - 目标对象集合
 * @param {CB|Subscriber<CB>} callback - 回调函数或已存在的订阅者实例
 * @param {SubscriptionOptions} [options] - 订阅选项
 * @param {boolean} [options.batch=true] - 是否使用批处理模式，为true时会合并短时间内的多次通知
 * @param {number} [options.limit=0] - 触发次数限制，0表示无限制，大于0时会在触发指定次数后自动取消订阅
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，为true时会随当前作用域销毁而自动取消订阅
 * @returns {Subscriber<CB>} 返回订阅者实例，可用于手动取消订阅
 * @example
 * const user1 = { name: 'John' }
 * const user2 = { name: 'Alice' }
 * const subscriber = subscribes([user1, user2], (props, target) => {
 *   console.log(`对象的属性 ${props.join(',')} 发生了变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 */
export function subscribes<T extends AnyObject, CB extends AnyCallback>(
  targets: Set<T> | T[],
  callback: CB | Subscriber<CB>,
  options?: SubscriptionOptions
): Subscriber<CB> {
  return ObserverManager.subscribes(targets, callback, options)
}

/**
 * ## 订阅对象指定属性变更
 *
 * 创建一个订阅，监听指定对象的属性变更。当目标对象的属性发生变化时，
 * 会触发提供的回调函数。此函数是响应式系统的核心API之一，用于建立
 * 对象属性与副作用之间的关联。
 *
 * @template T - 目标对象的类型
 * @template CB - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {CB|Subscriber<CB>} callback - 回调函数或已存在的订阅者实例
 * @param {keyof T} property - 要监听的属性名，默认为监听所有属性变更
 * @param {SubscriptionOptions} [options] - 订阅选项
 * @param {boolean} [options.batch=true] - 是否使用批处理模式，为true时会合并短时间内的多次通知
 * @param {number} [options.limit=0] - 触发次数限制，0表示无限制，大于0时会在触发指定次数后自动取消订阅
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，为true时会随当前作用域销毁而自动取消订阅
 * @returns {Subscriber<CB>} 返回订阅者实例，可用于手动取消订阅
 * @example
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribe(user,'name', () => {
 *   console.log(`name 属性值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 */
export function subscribeProperty<T extends AnyObject, CB extends AnyCallback>(
  target: T,
  property: keyof T,
  callback: CB | Subscriber<CB>,
  options?: SubscriptionOptions
): Subscriber<CB> {
  return ObserverManager.subscribeProperty(target, property, callback, options)
}

/**
 * ## 同时订阅多个属性
 *
 * 为目标对象的多个属性注册相同的订阅者，当任何一个属性变更时触发回调。
 * 内部会优化处理方式，避免重复通知。
 *
 * @template T - 目标对象的类型
 * @template CB - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {Array<keyof T>|Set<keyof T>} properties - 属性名集合
 * @param {CB|Subscriber<CB>} callback - 回调函数或已存在的订阅者实例
 * @param {SubscriptionOptions} [options] - 订阅选项
 * @param {boolean} [options.batch=true] - 是否使用批处理模式，为true时会合并短时间内的多次通知
 * @param {number} [options.limit=0] - 触发次数限制，0表示无限制，大于0时会在触发指定次数后自动取消订阅
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，为true时会随当前作用域销毁而自动取消订阅
 * @returns {Subscriber<CB>} 返回订阅者实例，可用于手动取消订阅
 * @example
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribeProperties(user, ['name', 'age'], (props, target) => {
 *   console.log(`属性 ${props.join(',')} 的值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 */
export function subscribeProperties<T extends AnyObject, CB extends AnyCallback>(
  target: T,
  properties: Array<keyof T> | Set<keyof T>,
  callback: CB | Subscriber<CB>,
  options?: SubscriptionOptions
): Subscriber<CB> {
  return ObserverManager.subscribeProperties(target, properties, callback, options)
}
