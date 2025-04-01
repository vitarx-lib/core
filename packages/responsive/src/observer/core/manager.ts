import { Subscriber, type SubscriberOptions } from './subscriber.js'
import { isArray, isFunction, microTaskDebouncedCallback } from '@vitarx/utils'

/** 全局变更标识符类型 */
export type GlobalChangeSymbol = typeof Observer.GLOBAL_CHANGE_SYMBOL

/**
 * 订阅者配置选项
 */
export interface SubscriptionOptions extends SubscriberOptions {
  /**
   * 是否使用批处理模式
   *
   * 启用批处理时，多个连续的变更会合并为一次通知，提高性能。
   * 禁用批处理时，每次变更都会立即触发通知，适用于需要实时响应的场景。
   *
   * 注意：禁用批处理可能导致性能问题，例如数组操作时触发多次回调。
   *
   * @default true
   */
  batch?: boolean
}

// 变更队列
type ChangeQueue = Map<AnyObject, Set<AnyKey | GlobalChangeSymbol>>
// 订阅者集合
export type SubscriberSet = Set<Subscriber | AnyCallback>
// 属性订阅映射
export type PropertySubscriberMap = Map<AnyKey | GlobalChangeSymbol, SubscriberSet>
// 订阅存储
export type SubscriberStore = WeakMap<AnyObject, PropertySubscriberMap>

/**
 * # 观察者管理器
 *
 * 负责管理订阅关系并在数据变更时通知相关订阅者。
 *
 * @class ObserverManager
 */
export class Observer {
  /**
   * 全局变更标识符
   * 用于订阅对象的所有属性变更
   */
  static GLOBAL_CHANGE_SYMBOL = Symbol('GLOBAL_CHANGE_SYMBOL')

  /**
   * 目标对象标识符
   * 用于获取响应式对象的原始目标
   */
  static TARGET_SYMBOL = Symbol('TARGET_SYMBOL')

  // 防止并发修改的锁
  static #accessLock = new WeakSet<object>()

  // 批处理模式的订阅存储
  static #batchSubscribers: SubscriberStore = new WeakMap()

  // 即时模式的订阅存储
  static #immediateSubscribers: SubscriberStore = new WeakMap()

  // 微任务变更队列
  static #pendingChanges: ChangeQueue = new Map()

  // 是否正在处理队列
  static #isProcessingQueue = false

  /**
   * 获取订阅存储
   *
   * @param {boolean} [batch=true] - 是否获取批处理模式的存储
   * @returns {Readonly<SubscriberStore>} - 只读的订阅存储
   */
  static getSubscriberStore(batch: boolean = true): Readonly<SubscriberStore> {
    return batch ? this.#batchSubscribers : this.#immediateSubscribers
  }

  /**
   * ## 触发变更通知
   *
   * 通知订阅者目标对象的指定属性已变更
   *
   * @param {AnyObject} target - 变更的目标对象
   * @param {AnyKey|AnyKey[]} property - 变更的属性名或属性名数组
   */
  static notify<T extends AnyObject, P extends AnyKey>(target: T, property: P | P[]): void {
    // 如果队列未在处理中，初始化处理流程
    if (!this.#isProcessingQueue) {
      this.#pendingChanges = new Map()
      this.#isProcessingQueue = true
      // 使用微任务处理队列
      Promise.resolve().then(() => this.#flushChangeQueue())
    }

    // 获取原始目标对象
    target = this.getOriginalTarget(target)
    const properties = isArray(property) ? property : [property]

    // 获取订阅存储
    const immediateSubscribers = this.#immediateSubscribers.get(target)
    const batchSubscribers = this.#batchSubscribers.get(target)

    if (immediateSubscribers || batchSubscribers) {
      for (const prop of properties) {
        // 立即通知即时模式的订阅者
        this.#notifySubscribers(target, immediateSubscribers?.get(prop), [prop])

        // 将变更添加到队列中，用于批处理模式
        if (this.#pendingChanges.has(target)) {
          this.#pendingChanges.get(target)!.add(prop)
        } else {
          this.#pendingChanges.set(target, new Set([prop]))
        }
      }

      // 通知关注全局变更的即时订阅者
      this.#notifySubscribers(
        target,
        immediateSubscribers?.get(this.GLOBAL_CHANGE_SYMBOL),
        properties
      )
    }
  }

  /**
   * 检查对象是否有订阅者
   *
   * @param {AnyObject} target - 目标对象
   * @param {AnyKey} property - 属性名，默认为全局变更标识符
   * @returns {boolean} - 是否存在订阅者
   */
  static hasSubscribers(target: AnyObject, property: AnyKey = this.GLOBAL_CHANGE_SYMBOL): boolean {
    target = this.getOriginalTarget(target)
    return !!(
      this.#batchSubscribers.get(target)?.has(property) ||
      this.#immediateSubscribers.get(target)?.has(property)
    )
  }

  /**
   * ## 注册订阅者
   *
   * @param {AnyObject} target - 目标对象
   * @param {Function|Subscriber} callback - 回调函数或订阅者实例
   * @param {AnyKey} property - 属性名，默认为全局变更标识符
   * @param {SubscriptionOptions} options - 订阅选项
   * @returns {Subscriber} - 订阅者实例
   */
  static subscribe<T extends AnyObject, C extends AnyCallback>(
    target: T,
    callback: C | Subscriber<C>,
    property: AnyKey = this.GLOBAL_CHANGE_SYMBOL,
    options?: SubscriptionOptions
  ): Subscriber<C> {
    const subscriber = this.createSubscriber(callback, options)
    this.addSubscriber(target, property, subscriber, options?.batch)
    return subscriber
  }

  /**
   * ## 同时订阅多个属性
   *
   * @param {AnyObject} target - 目标对象
   * @param {AnyKey[]|Set<AnyKey>} properties - 属性名集合
   * @param {Function|Subscriber} callback - 回调函数或订阅者实例
   * @param {SubscriptionOptions} options - 订阅选项
   * @returns {Subscriber} - 订阅者实例
   */
  static subscribeMultipleProps<C extends AnyCallback>(
    target: AnyObject,
    properties: AnyKey[] | Set<AnyKey>,
    callback: C | Subscriber<C>,
    options?: SubscriptionOptions
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

    // 对单个属性或禁用批处理时，为每个属性单独添加订阅
    if (options?.batch === false || properties.size === 1) {
      for (const property of properties) {
        this.addSubscriber(target, property, subscriber, options?.batch)
      }
    } else {
      // 使用批处理模式，创建一个过滤器回调
      const propertySet = properties instanceof Set ? properties : new Set(properties)

      // 添加一个不进行批处理的回调，但内部使用微任务防抖
      const unsubscribe = this.addSyncSubscriber(
        target,
        microTaskDebouncedCallback(
          (changedProps: AnyKey[]) => {
            const relevantChanges: AnyKey[] = []

            // 过滤出订阅的属性
            for (const prop of new Set(changedProps)) {
              if (propertySet.has(prop)) {
                relevantChanges.push(prop)
              }
            }

            // 如果有相关变更，触发订阅者
            if (relevantChanges.length) {
              ;(subscriber as Subscriber).trigger(relevantChanges, target)
            }
          },
          (latest, previous) => {
            if (!previous) return latest
            previous[0].push(...latest[0])
            return previous
          }
        )
      )

      // 订阅者销毁时取消订阅
      subscriber.onCleanup(unsubscribe)
    }

    return subscriber
  }

  /**
   * ## 添加即时回调函数
   *
   * 添加一个不使用批处理的回调函数，用于高级场景
   *
   * @param {AnyObject} target - 目标对象
   * @param {AnyFunction} callback - 回调函数
   * @param {AnyKey} property - 属性名，默认为全局变更标识符
   * @returns {Function} - 取消订阅函数
   */
  static addSyncSubscriber<C extends AnyCallback>(
    target: AnyObject,
    callback: C,
    property: AnyKey = this.GLOBAL_CHANGE_SYMBOL
  ): () => void {
    this.addSubscriber(target, property, callback, false)
    return () => this.removeSubscriber(target, property, callback, false)
  }

  /**
   * ## 同时为多个对象注册相同的订阅者
   *
   * @param {AnyObject[]|Set<AnyObject>} targets - 目标对象集合
   * @param {Function|Subscriber} callback - 回调函数或订阅者实例
   * @param {SubscriptionOptions} options - 订阅选项
   * @returns {Subscriber} - 订阅者实例
   */
  static subscribeToMultiple<T extends AnyObject, C extends AnyCallback>(
    targets: Set<T> | T[],
    callback: C | Subscriber<C>,
    options?: SubscriptionOptions
  ): Subscriber<C> {
    if (Array.isArray(targets)) {
      targets = new Set(targets)
    }

    if (!(targets instanceof Set) || targets.size === 0) {
      throw new TypeError('Targets must be a non-empty array or set')
    }

    const subscriber = this.createSubscriber(callback, options)

    // 为每个目标添加订阅
    for (const target of targets) {
      this.addSubscriber(target, this.GLOBAL_CHANGE_SYMBOL, subscriber, options?.batch)
    }

    // 订阅者销毁时取消所有订阅
    subscriber.onCleanup(() => {
      for (const target of targets) {
        this.removeSubscriber(target, this.GLOBAL_CHANGE_SYMBOL, subscriber, options?.batch)
      }
    })

    return subscriber
  }

  /**
   * 创建订阅者实例
   *
   * @param {Function|Subscriber} callback - 回调函数或订阅者实例
   * @param {SubscriberOptions} options - 订阅选项
   * @returns {Subscriber} - 订阅者实例
   */
  static createSubscriber<C extends AnyCallback>(
    callback: C | Subscriber<C>,
    options?: SubscriberOptions
  ): Subscriber<C> {
    return isFunction(callback) ? new Subscriber(callback, options) : callback
  }

  /**
   * 获取响应式对象的原始目标
   *
   * @param {AnyObject} object - 响应式对象
   * @returns {AnyObject} - 原始目标对象
   */
  static getOriginalTarget<T extends AnyObject>(object: T): T {
    return (Reflect.get(object, this.TARGET_SYMBOL) as T) ?? object
  }

  /**
   * ## 添加订阅者
   *
   * @param {AnyObject} target - 目标对象
   * @param {AnyKey} property - 属性名
   * @param {Subscriber|AnyCallback} subscriber - 订阅者或回调函数
   * @param {boolean} batch - 是否使用批处理模式，默认为true
   */
  static addSubscriber<C extends AnyCallback>(
    target: AnyObject,
    property: AnyKey,
    subscriber: Subscriber<C> | C,
    batch: boolean = true
  ): void {
    // 获取存储
    const store = this.getSubscriberStore(batch)
    // 获取原始目标对象
    const originalTarget = this.getOriginalTarget(target)

    // 加锁防止并发修改
    const unlock = this.#acquireLock(originalTarget)

    try {
      // 确保目标在存储中有对应的映射
      if (!store.has(originalTarget)) {
        store.set(originalTarget, new Map())
      }

      // 获取属性映射
      const propertyMap = store.get(originalTarget)!

      // 确保属性有对应的订阅者集合
      if (!propertyMap.has(property)) {
        propertyMap.set(property, new Set())
      }

      // 添加订阅者
      propertyMap.get(property)!.add(subscriber)

      // 如果是Subscriber实例，添加清理回调
      if (subscriber instanceof Subscriber) {
        subscriber.onCleanup(() =>
          this.removeSubscriber(originalTarget, property, subscriber, batch)
        )
      }
    } finally {
      // 解锁
      unlock()
    }
  }

  /**
   * ## 移除订阅者
   *
   * @param {AnyObject} target - 目标对象
   * @param {AnyKey} property - 属性名
   * @param {Subscriber|AnyCallback} subscriber - 订阅者或回调函数
   * @param {boolean} batch - 是否使用批处理模式，默认为true
   */
  static removeSubscriber<C extends AnyCallback>(
    target: AnyObject,
    property: AnyKey,
    subscriber: Subscriber<C> | AnyCallback,
    batch: boolean = true
  ): void {
    const store = this.getSubscriberStore(batch)
    target = this.getOriginalTarget(target)

    const unlock = this.#acquireLock(target)
    const subscriberSet = store.get(target)?.get(property)

    if (!subscriberSet) return

    try {
      subscriberSet.delete(subscriber)

      // 清理空集合
      if (subscriberSet.size === 0) {
        store.get(target)?.delete(property)
      }

      // 清理空映射
      if (store.get(target)?.size === 0) {
        store.delete(target)
      }
    } finally {
      unlock()
    }
  }

  /**
   * ## 处理变更队列
   *
   * @private
   */
  static #flushChangeQueue(): void {
    // 重置处理状态
    this.#isProcessingQueue = false
    const queue: ChangeQueue = this.#pendingChanges

    // 处理每个目标的变更
    for (const [target, properties] of queue) {
      this.#notifyTargetChanges(target, properties)
    }
  }

  /**
   * 处理目标对象的属性变更
   *
   * @param target - 目标对象
   * @param properties - 变更的属性集合
   * @private
   */
  static #notifyTargetChanges(target: AnyObject, properties: Set<AnyKey>): void {
    // 获取批处理订阅者
    const subscribers = this.#batchSubscribers.get(target)
    if (!subscribers) return

    // 通知每个属性的订阅者
    for (const property of properties) {
      this.#notifySubscribers(target, subscribers.get(property), [property])
    }

    // 如果没有全局变更订阅，则通知全局订阅者
    if (!properties.has(this.GLOBAL_CHANGE_SYMBOL)) {
      this.#notifySubscribers(
        target,
        subscribers.get(this.GLOBAL_CHANGE_SYMBOL),
        Array.from(properties)
      )
    }
  }

  /**
   * ## 通知订阅者
   *
   * @param target - 目标对象
   * @param subscribers - 订阅者集合
   * @param changedProperties - 变更的属性列表
   * @private
   */
  static #notifySubscribers<T extends AnyObject>(
    target: T,
    subscribers: SubscriberSet | undefined,
    changedProperties: AnyKey[]
  ): void {
    if (subscribers?.size) {
      for (const subscriber of subscribers) {
        if (typeof subscriber === 'function') {
          subscriber(changedProperties, target)
        } else {
          subscriber.trigger(changedProperties, target)
        }
      }
    }
  }

  /**
   * ## 锁定目标对象的访问
   *
   * 防止并发修改导致的问题
   *
   * @param target - 目标对象
   * @returns {Function} - 解锁函数
   * @private
   */
  static #acquireLock(target: AnyObject): () => void {
    // 等待直到目标没有被锁定
    while (this.#accessLock.has(target)) {}

    // 锁定目标
    this.#accessLock.add(target)

    // 返回解锁函数
    return () => {
      this.#accessLock.delete(target)
    }
  }
}

export { Observer as ObserverManager }
