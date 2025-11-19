import { AnyObject } from '@vitarx/utils'
import { Scheduler } from './scheduler.js'
import { ALL_PROPERTIES_SYMBOL, type ChangeCallback, SubManager } from './subManager.js'
import { Subscriber, type SubscriberOptions } from './subscriber.js'

/**
 * 触发变更通知
 *
 * 通知订阅者目标对象的指定属性已变更。当响应式对象的属性发生变化时，
 * 调用此函数可以手动触发通知机制，使所有订阅该属性的订阅者收到更新通知。
 *
 * @alias trigger - 兼容 vue api
 * @template T - 目标对象的类型
 * @template P - 目标对象的属性键类型
 * @param {T} target - 变更的目标对象
 * @param {P|P[]} property - 变更的属性名或属性名数组
 * @returns {void} 无返回值
 * @example
 * ```js
 * const user = { name: 'John', age: 30 }
 * notify(user, 'name') // 通知name属性已变更
 * notify(user, ['name', 'age']) // 通知多个属性已变更
 * ```
 */
export function notify<T extends AnyObject, P extends keyof T>(target: T, property: P | P[]): void {
  SubManager.notify(target, property)
}

export { notify as trigger }

/**
 * 检查对象是否存在订阅者
 *
 * 判断目标对象是否有订阅者监听其属性变更。
 * 可以检查整个对象或指定属性的订阅情况。
 *
 * @example
 * ```ts
 * const user = { name: 'John', age: 30 }
 *
 * // 检查对象是否有订阅者（任意属性）
 * hasSubscribers(user) // false
 *
 * // 添加订阅
 * subscribe(user, () => console.log('changed'))
 *
 * // 再次检查
 * hasSubscribers(user) // true
 *
 * // 检查特定属性是否有订阅者
 * hasSubscribers(user, 'name') // false
 * subscribeProperty(user, 'name', () => console.log('name changed'))
 * hasSubscribers(user, 'name') // true
 * ```
 *
 * @template T - 目标对象类型
 * @param {T} target - 目标对象
 * @param {keyof T} [property] - 可选的属性名，不传则检查整个对象的订阅情况
 * @returns {boolean} - 如果存在订阅者返回 true，否则返回 false
 */
export function hasSubscribers<T extends AnyObject>(
  target: T,
  property?: keyof T
): boolean {
  return SubManager.hasSubscribers(target, property ?? SubManager.ALL_PROPERTIES_SYMBOL)
}

/**
 * 订阅对象变化
 *
 * 为指定对象注册变更订阅，返回可用于管理订阅生命周期的订阅者实例。
 *
 * @example
 * ```ts
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribe(user, (props,target) => {
 *   console.log(`属性 ${props.join(',')} 的值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 * ```
 *
 * @template T - 目标对象类型
 * @template C - 回调函数类型
 * @param { T } target - 目标对象
 * @param { C | Subscriber<C> } callback - 回调函数或订阅者实例
 * @param { SubscriberOptions } [options] - 订阅选项
 * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 * @param { function } [options.paramsHandler] - 参数处理器
 * @returns { Subscriber<C> } - 订阅者实例
 */
export function subscribe<T extends AnyObject, C extends ChangeCallback<T>>(
  target: T,
  callback: C | Subscriber<C>,
  options?: SubscriberOptions<C>
): Subscriber<C> {
  return SubManager.subscribe(target, callback, options)
}

/**
 * ## 同时订阅多个对象
 *
 * 为多个目标对象注册相同的订阅者，当任何一个对象发生变更时触发回调。
 * 返回的订阅者实例可用于统一管理所有订阅。
 *
 * @example
 * ```js
 * const user1 = { name: 'John' }
 * const user2 = { name: 'Alice' }
 * const subscriber = subscribes([user1, user2], (props, target) => {
 *   console.log(`对象的属性 ${props.join(',')} 发生了变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 * ```
 *
 * @template T - 目标对象的类型
 * @template C - 回调函数的类型
 * @param {Set<T>|T[]} targets - 目标对象集合
 * @param {C|Subscriber<C>} callback - 回调函数或已存在的订阅者实例
 * @param { SubscriberOptions } [options] - 订阅器选项
 * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 * @param { function } [options.paramsHandler] - 参数处理器
 * @returns {Subscriber<C>} 返回订阅者实例，可用于手动取消订阅
 */
export function subscribes<T extends AnyObject, C extends ChangeCallback<T>>(
  targets: Set<T> | T[],
  callback: C | Subscriber<C>,
  options?: SubscriberOptions<C>
): Subscriber<C> {
  return SubManager.subscribes(targets, callback, options)
}

/**
 * ## 订阅对象指定属性变更
 *
 * 创建一个订阅，监听指定对象的属性变更。当目标对象的属性发生变化时，
 * 会触发提供的回调函数。此函数是响应式系统的核心API之一，用于建立
 * 对象属性与副作用之间的关联。
 *
 * @example
 * ```js
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribeProperty(user,'name', () => {
 *   console.log(`name 属性值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 * ```
 *
 * @template T - 目标对象的类型
 * @template C - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {C|Subscriber<C>} callback - 回调函数或已存在的订阅者实例
 * @param {keyof T} property - 要监听的属性名，默认为监听所有属性变更
 * @param { SubscriberOptions } [options] - 订阅器选项
 * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 * @param { function } [options.paramsHandler] - 参数处理器
 * @returns {Subscriber<C>} 返回订阅者实例，可用于手动取消订阅
 */
export function subscribeProperty<T extends AnyObject, C extends ChangeCallback<T>>(
  target: T,
  property: keyof T,
  callback: C | Subscriber<C>,
  options?: SubscriberOptions<C>
): Subscriber<C> {
  return SubManager.subscribeProperty(target, property, callback, options)
}

/**
 * ## 同时订阅多个属性
 *
 * 为目标对象的多个属性注册相同的订阅者，当任何一个属性变更时触发回调。
 * 内部会优化处理方式，避免重复通知。
 *
 * @example
 * ```js
 * const user = { name: 'John', age: 30 }
 * const subscriber = subscribeProperties(user, ['name', 'age'], (props, target) => {
 *   console.log(`属性 ${props.join(',')} 的值已发生变更`)
 * })
 * // 取消订阅
 * subscriber.dispose()
 * ```
 *
 * @template T - 目标对象的类型
 * @template C - 回调函数的类型
 * @param {T} target - 目标对象，要监听其属性变更的对象
 * @param {Array<keyof T>|Set<keyof T>} properties - 属性名集合
 * @param {C|Subscriber<C>} callback - 回调函数或已存在的订阅者实例
 * @param { SubscriberOptions } [options] - 订阅器选项
 * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 * @param { function } [options.paramsHandler] - 参数处理器
 * @returns {Subscriber<C>} 返回订阅者实例，可用于手动取消订阅
 */
export function subscribeProperties<T extends AnyObject, C extends ChangeCallback<T>>(
  target: T,
  properties: Array<keyof T> | Set<keyof T>,
  callback: C | Subscriber<C>,
  options?: SubscriberOptions<C>
): Subscriber<C> {
  return SubManager.subscribeProperties(target, properties, callback, options)
}

/**
 * 将回调推迟到下一个微任务执行
 * @param fn 可选的回调函数
 * @returns {Promise<void>} 在微任务阶段解析的 Promise
 */
export function nextTick(fn?: () => void): Promise<void> {
  return Scheduler.nextTick(fn)
}
