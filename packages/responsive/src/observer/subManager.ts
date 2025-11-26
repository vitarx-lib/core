import { AnyCallback, AnyKey, AnyObject, isArray } from '@vitarx/utils'
import { Subscriber, type SubscriberOptions } from './subscriber.js'

/**
 * 全局属性变更标识符
 *
 * 用于订阅对象的所有属性变更，作为通配符使用。
 * 当使用此标识符订阅时，对象的任何属性变更都会触发通知。
 */
export const ALL_PROPERTIES_SYMBOL = Symbol.for('__v_observer_all_prop')
export type ALL_PROPERTIES_SYMBOL = typeof ALL_PROPERTIES_SYMBOL

/**
 * 监听目标变化时的回调函数
 *
 * 用于处理对象属性变更的回调函数类型。
 *
 * @template T - 目标对象类型
 * @param {Array<keyof T>} properties - 变更的属性名数组
 * @param {T} target - 变更的目标对象
 */
export type ChangeCallback<T extends AnyObject> = (properties: Array<keyof T>, target: T) => void

/**
 * 目标对象标识符
 *
 * 用于在代理对象上标识原始目标对象的Symbol。
 * 可将此标识符作为对象的属性，属性值为实际用于订阅的原始目标对象。
 */
const OBS_TARGET_SYMBOL = Symbol.for('__v_observer_target')
export type OBS_TARGET_SYMBOL = typeof OBS_TARGET_SYMBOL

// 订阅者集合
type SubscriberSet = Set<Subscriber | AnyCallback>
// 属性订阅映射
type PropertySubscriberMap = Map<AnyKey, SubscriberSet>
// 订阅存储
type SubscriberStore = WeakMap<AnyObject, PropertySubscriberMap>
// 订阅者集合
const OBS_STORE: SubscriberStore = new WeakMap()
/**
 * 观察者管理器
 *
 * 负责管理订阅关系并在数据变更时通知相关订阅者。
 */
export class SubManager {
  /**
   * 全局属性变更标识符
   *
   * 用于订阅对象的所有属性变更，作为通配符使用。
   * 当使用此标识符订阅时，对象的任何属性变更都会触发通知。
   *
   * @type {ALL_PROPERTIES_SYMBOL}
   */
  static ALL_PROPERTIES_SYMBOL: ALL_PROPERTIES_SYMBOL = ALL_PROPERTIES_SYMBOL

  /**
   * 目标对象标识符
   *
   * 用于在代理对象上标识原始目标对象的Symbol。
   * 可将此标识符作为对象的属性，属性值为实际用于订阅的原始目标对象。
   *
   * @type {OBS_TARGET_SYMBOL}
   */
  static TARGET_SYMBOL: OBS_TARGET_SYMBOL = OBS_TARGET_SYMBOL
  /**
   * 触发变更通知
   *
   * 通知订阅者目标对象的指定属性已变更。该方法会将变更添加到队列中，
   * 并通过微任务异步处理，以提高性能。对于即时模式的订阅者，会立即触发通知。
   *
   * @template T - 目标对象类型
   * @param {T} target - 变更的目标对象
   * @param {keyof T | Array<keyof T>} property - 变更的属性名或属性名数组
   * @returns {void} - 无返回值
   */
  static notify<T extends AnyObject>(target: T, property: keyof T | Array<keyof T>): void {
    // 获取原始目标对象
    target = this.getOriginalTarget(target)
    const properties = isArray(property) ? property : [property]
    // 获取订阅存储
    const subscribers = OBS_STORE.get(target)

    if (subscribers) {
      for (const prop of properties) {
        this._notifySubscribers(target, subscribers?.get(prop), [prop])
      }
      // 通知关注全局变更的即时订阅者
      this._notifySubscribers(target, subscribers?.get(this.ALL_PROPERTIES_SYMBOL), properties)
    }
  }
  /**
   * 检查对象是否有订阅者
   *
   * @template T - 目标对象类型
   * @param {T} target - 目标对象
   * @param {keyof T | ALL_PROPERTIES_SYMBOL} property - 属性名，默认为全局变更标识符
   * @returns {boolean} - 如果存在订阅者返回true，否则返回false
   */
  static hasSubscribers<T extends AnyObject>(
    target: T,
    property: keyof T | ALL_PROPERTIES_SYMBOL = ALL_PROPERTIES_SYMBOL
  ): boolean {
    target = this.getOriginalTarget(target)
    return !!OBS_STORE.get(target)?.has(property)
  }
  /**
   * 订阅对象变化
   *
   * 为指定对象注册变更订阅，返回可用于管理订阅生命周期的订阅者实例。
   *
   * @template T - 目标对象类型
   * @template C - 回调函数类型
   * @param { T } target - 目标对象
   * @param { C | Subscriber<C> } callback - 回调函数或订阅者实例
   * @param { SubscriberOptions } [options] - 订阅器选项
   * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
   * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
   * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
   * @param { function } [options.paramsHandler] - 参数处理器
   * @returns { Subscriber<C> } - 订阅者实例
   */
  static subscribe<T extends AnyObject, C extends ChangeCallback<T>>(
    target: T,
    callback: C | Subscriber<C>,
    options?: SubscriberOptions<C>
  ): Subscriber<C> {
    const subscriber = this.createSubscriber(callback, options)
    this.addSubscriber(target, this.ALL_PROPERTIES_SYMBOL, subscriber)
    return subscriber
  }
  /**
   * 订阅对象属性变更
   *
   * 为指定对象的属性注册变更订阅，返回可用于管理订阅生命周期的订阅者实例。
   *
   * @template T - 目标对象类型
   * @template C - 回调函数类型
   * @param {T} target - 目标对象
   * @param {C|Subscriber<C>} callback - 回调函数或订阅者实例
   * @param {keyof T} property - 属性名。
   * @param { SubscriberOptions } [options] - 订阅器选项
   * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
   * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
   * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
   * @param { function } [options.paramsHandler] - 参数处理器
   * @returns {Subscriber<C>} - 订阅者实例
   */
  static subscribeProperty<T extends AnyObject, C extends ChangeCallback<T>>(
    target: T,
    property: keyof T,
    callback: C | Subscriber<C>,
    options?: SubscriberOptions<C>
  ): Subscriber<C> {
    const subscriber = this.createSubscriber(callback, options)
    this.addSubscriber(target, property, subscriber)
    return subscriber
  }
  /**
   * 同时订阅对象的多个属性变更
   *
   * 为目标对象的多个属性注册相同的订阅者，当任何一个属性变更时触发回调。
   * 内部会优化处理方式，避免重复通知。
   *
   * @template T - 目标对象类型
   * @template CB - 回调函数类型
   * @param {T} target - 目标对象
   * @param {Array<keyof T>|Set<keyof T>} properties - 属性名集合
   * @param {CB|Subscriber<CB>} callback - 回调函数或订阅者实例
   * @param { SubscriberOptions } [options] - 订阅器选项
   * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
   * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
   * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
   * @param { function } [options.paramsHandler] - 参数处理器
   * @returns {Subscriber<CB>} - 订阅者实例
   */
  static subscribeProperties<T extends AnyObject, C extends ChangeCallback<T>>(
    target: T,
    properties: Array<keyof T> | Set<keyof T>,
    callback: C | Subscriber<C>,
    options?: SubscriberOptions<C>
  ): Subscriber<C> {
    if (!target || typeof target !== 'object') {
      throw new TypeError('Target must be an object')
    }

    if (Array.isArray(properties)) {
      properties = new Set(properties)
    }

    if (properties.size === 0) {
      throw new TypeError('Properties must be a non-empty array or set')
    }
    // 创建订阅者
    const subscriber = this.createSubscriber(callback, options)

    for (const property of properties) {
      this.addSubscriber(target, property, subscriber, false)
    }
    subscriber.onDispose(() => {
      for (const property of properties) {
        this.removeSubscriber(target, property, subscriber)
      }
    })
    return subscriber
  }

  /**
   * 添加即时回调函数
   *
   * 添加一个不使用批处理的回调函数，用于需要立即响应变更的高级场景。
   * 每次属性变更都会立即触发回调，而不会等待微任务队列处理。
   *
   * @template T - 目标对象类型
   * @template CB - 回调函数类型
   * @param {T} target - 目标对象
   * @param {CB} callback - 回调函数
   * @param {keyof T | ALL_PROPERTIES_SYMBOL} property - 属性名，默认为全局变更标识符
   * @returns {() => void} - 取消订阅函数
   */
  static addSyncSubscriber<T extends AnyObject, CB extends ChangeCallback<T>>(
    target: T,
    callback: CB,
    property: keyof T | ALL_PROPERTIES_SYMBOL = this.ALL_PROPERTIES_SYMBOL
  ): () => void {
    this.addSubscriber(target, property, callback)
    return () => this.removeSubscriber(target, property, callback)
  }

  /**
   * 同时为多个对象注册相同的订阅者
   *
   * 为多个目标对象注册相同的订阅者，当任何一个对象发生变更时触发回调。
   * 返回的订阅者实例可用于统一管理所有订阅。
   *
   * @template T - 目标对象类型
   * @template C - 回调函数类型
   * @param {Set<T>|T[]} targets - 目标对象集合
   * @param {C|Subscriber<C>} callback - 回调函数或订阅者实例
   * @param { SubscriberOptions } [options] - 订阅器选项
   * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
   * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
   * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
   * @param { function } [options.paramsHandler] - 参数处理器
   * @returns {Subscriber<C>} - 订阅者实例
   */
  static subscribes<T extends AnyObject, C extends ChangeCallback<T>>(
    targets: Set<T> | T[],
    callback: C | Subscriber<C>,
    options?: SubscriberOptions<C>
  ): Subscriber<C> {
    if (Array.isArray(targets)) {
      targets = new Set(targets)
    }

    if (!(targets instanceof Set) || targets.size === 0) {
      throw new TypeError('Targets must be a non-empty array or set collection')
    }

    const subscriber = this.createSubscriber(callback, options)

    // 为每个目标添加订阅
    for (const target of targets) {
      // 跳过非对象目标
      if (typeof target !== 'object' || target === null) {
        targets.delete(target)
        continue
      }
      this.addSubscriber(target, this.ALL_PROPERTIES_SYMBOL, subscriber, false)
    }
    subscriber.onDispose(() => {
      for (const target of targets) {
        this.removeSubscriber(target, this.ALL_PROPERTIES_SYMBOL, subscriber)
      }
    })
    return subscriber
  }

  /**
   * 创建订阅者实例
   *
   * 根据提供的回调函数或现有订阅者创建新的订阅者实例。
   * 如果传入的是函数，则创建新实例；如果是订阅者实例，则直接返回。
   *
   * @template C - 回调函数类型
   * @param {C|Subscriber<C>} callback - 回调函数或订阅者实例
   * @param { SubscriberOptions } [options] - 订阅器选项
   * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
   * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
   * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
   * @param { function } [options.paramsHandler] - 参数处理器
   * @returns {Subscriber<C>} - 订阅者实例
   */
  static createSubscriber<C extends AnyCallback>(
    callback: C | Subscriber<C>,
    options?: SubscriberOptions<C>
  ): Subscriber<C> {
    return typeof callback === 'function' ? new Subscriber(callback, options) : callback
  }

  /**
   * 获取响应式对象的原始目标
   *
   * 从可能是代理的响应式对象中获取原始目标对象。
   * 如果对象上存在TARGET_SYMBOL属性，则返回该属性值；否则返回对象本身。
   *
   * @template T - 对象类型
   * @returns {T} - 原始目标对象
   * @param obj
   */
  static getOriginalTarget<T extends AnyObject>(obj: T): T {
    return (Reflect.get(obj, this.TARGET_SYMBOL) as T) ?? obj
  }

  /**
   * 添加订阅者
   *
   * 为目标对象的指定属性添加订阅者或回调函数。
   * 内部实现方法，用于支持各种订阅API。
   *
   * @template T - 目标对象类型
   * @template C - 回调函数类型
   * @param {T} target - 目标对象
   * @param {keyof T | ALL_PROPERTIES_SYMBOL} property - 属性名
   * @param {Subscriber<C>|C} subscriber - 订阅者或回调函数
   * @param {boolean} [autoRemove=true] - 是否自动移除订阅者
   * @returns {void}
   */
  static addSubscriber<T extends AnyObject, C extends AnyCallback>(
    target: T,
    property: keyof T | ALL_PROPERTIES_SYMBOL,
    subscriber: Subscriber<C> | C,
    autoRemove: boolean = true
  ): void {
    // 获取原始目标对象
    const originalTarget = this.getOriginalTarget(target)

    // 确保目标在存储中有对应的映射
    if (!OBS_STORE.has(originalTarget)) {
      OBS_STORE.set(originalTarget, new Map())
    }

    // 获取属性映射
    const propertyMap = OBS_STORE.get(originalTarget)!

    // 确保属性有对应的订阅者集合
    if (!propertyMap.has(property)) {
      propertyMap.set(property, new Set())
    }

    // 添加订阅者
    propertyMap.get(property)!.add(subscriber)

    // 如果是Subscriber实例，添加清理回调
    if (autoRemove && subscriber instanceof Subscriber) {
      subscriber.onDispose(() => this.removeSubscriber(originalTarget, property, subscriber))
    }
  }

  /**
   * 移除订阅者
   *
   * 从目标对象的指定属性中移除订阅者或回调函数。
   * 会自动清理空的集合和映射，释放内存。
   *
   * @template C - 回调函数类型
   * @param {AnyObject} target - 目标对象
   * @param {AnyKey} property - 属性名
   * @param {Subscriber<C>|AnyCallback} subscriber - 订阅者或回调函数
   * @returns {void}
   */
  static removeSubscriber<C extends AnyCallback>(
    target: AnyObject,
    property: AnyKey,
    subscriber: Subscriber<C> | AnyCallback
  ): void {
    target = this.getOriginalTarget(target)

    const subscriberSet = OBS_STORE.get(target)?.get(property)

    if (!subscriberSet) return

    subscriberSet.delete(subscriber)

    // 清理空集合
    if (subscriberSet.size === 0) {
      OBS_STORE.get(target)?.delete(property)
    }

    // 清理空映射
    if (OBS_STORE.get(target)?.size === 0) {
      OBS_STORE.delete(target)
    }
  }

  /**
   * 通知订阅者
   *
   * 触发订阅者集合中所有订阅者的回调函数。
   * 根据订阅者类型分别处理函数回调和Subscriber实例。
   *
   * @template T - 目标对象类型
   * @param {T} target - 目标对象
   * @param {SubscriberSet|undefined} subscribers - 订阅者集合
   * @param {AnyKey[]} changedProperties - 变更的属性列表
   * @private
   * @returns {void}
   */
  private static _notifySubscribers<T extends AnyObject>(
    target: T,
    subscribers: SubscriberSet | undefined,
    changedProperties: AnyKey[]
  ): void {
    if (!subscribers) return
    for (const subscriber of subscribers) {
      if (typeof subscriber === 'function') {
        subscriber(changedProperties, target)
      } else {
        subscriber.trigger(changedProperties, target)
      }
    }
  }
}
