import { Listener, type ListenerOptions } from './listener.js'
import { ExtractProp, PropName } from '../responsive/index.js'
import { isArray, isFunction, microTaskDebouncedCallback } from '../../utils/index.js'

/** 所有改变事件监听标识类型 */
export type AllChangeSymbol = typeof Observers.ALL_CHANGE_SYMBOL

/**
 * 配置选项
 */
export interface ObserverOptions extends ListenerOptions {
  /**
   * 是否采用批处理，默认为true，需谨慎使用false，假设监听的是一个数组，
   * 设置为false时，当执行array.slice等方法会触发多次回调。
   *
   * @default true
   */
  batch?: boolean
}

// 监听器集合
type Listeners = Set<Listener | AnyCallback>
/** 监听器映射MAP */
type PropListenerMap = Map<PropName | AllChangeSymbol, Listeners>
// 队列
type Queue = Map<AnyObject, Set<PropName | AllChangeSymbol>>
// 储存商店
type Store = WeakMap<object, PropListenerMap>

/**
 * 全局观察者管理器
 */
export class Observers {
  /**
   * 全部变更事件监听标识
   */
  static ALL_CHANGE_SYMBOL = Symbol('ALL_CHANGE_SYMBOL')
  /**
   * 对象使用该标记做为属性返回一个真实源对象做为监听对象。
   */
  static OBSERVERS_TARGET_SYMBOL = Symbol('OBSERVERS_TARGET_SYMBOL')
  // 监听源锁
  static #weakMapLock = new WeakSet<object>()
  // 批量处理的监听器
  static #batchHandleListeners: Store = new WeakMap()
  // 不批量处理的监听器
  static #notBatchHandleListeners: Store = new WeakMap()
  // 微任务队列
  static #triggerQueue: Queue = new Map()
  // 是否正在处理队列
  static #isHanding = false

  /**
   * 获取储存商店
   *
   * @param {boolean} [batch=true] - 传入false可以获取未采用批处理的监听器集合
   * @returns {WeakMap} - 只读的储存商店
   */
  static store(batch: boolean = true): Readonly<Store> {
    return batch ? this.#batchHandleListeners : this.#notBatchHandleListeners
  }

  /**
   * ## 触发监听器的回调函数
   *
   * @param {AnyObject} origin - 要触发的源对象，一般是 `ref` | `reactive` 创建的对象
   * @param {PropName|PropName[]} prop - 变更的属性名
   */
  static trigger<T extends AnyObject, P extends ExtractProp<T>>(origin: T, prop: P | P[]): void {
    // 如果不在微任务中，则开始处理队列
    if (!this.#isHanding) {
      this.#triggerQueue = new Map()
      this.#isHanding = true
      // 处理队列
      Promise.resolve().then(this.#handleTriggerQueue.bind(this))
    }
    origin = this.getObserveTarget(origin)
    const props = isArray(prop) ? prop : [prop]
    const notBatchListeners = this.#notBatchHandleListeners.get(origin)
    const batchListeners = this.#batchHandleListeners.get(origin)
    if (batchListeners || notBatchListeners) {
      for (const prop of props) {
        // 触发非批量处理的监听器
        this.#triggerListeners(notBatchListeners?.get(prop), origin, [prop])
        // 推送到队列
        if (this.#triggerQueue.has(origin)) {
          this.#triggerQueue.get(origin)!.add(prop)
        } else {
          this.#triggerQueue.set(origin, new Set([prop]))
        }
      }
      // 触发默认监听器
      this.#triggerListeners(notBatchListeners?.get(this.ALL_CHANGE_SYMBOL), origin, props)
    }
  }

  /**
   * ## 注册监听器
   *
   * 一般你无需使用此方法，通常使用助手函数`watch`。
   *
   * @param {AnyObject} origin - 监听源，一般是`ref`|`reactive`创建的对象
   * @param {Function|Listener} callback - 回调函数或监听器实例
   * @param {PropName} prop - 属性名，默认为{@linkcode Observers.ALL_CHANGE_SYMBOL}标记，监听全部变化
   * @param {ObserverOptions} options - 监听器选项
   * @returns {Listener} - 监听器实例
   */
  static register<T extends AnyObject, C extends AnyCallback>(
    origin: T,
    callback: C | Listener<C>,
    prop: PropName = this.ALL_CHANGE_SYMBOL,
    options?: ObserverOptions
  ): Listener<C> {
    const listener = this.createListener(callback, options)
    this.addListener(origin, prop, listener, options?.batch)
    return listener
  }

  /**
   * ## 注册一个监听器，同时监听多个属性
   *
   * @param {AnyObject} origin - 监听源，一般是`ref`|`reactive`创建的对象
   * @param {PropName[]} props - 属性名数组
   * @param {Function|Listener} callback - 回调函数或监听器实例
   * @param {ObserverOptions} options - 监听器选项
   * @returns {Listener} - 监听器实例
   */
  static registerProps<C extends AnyCallback>(
    origin: AnyObject,
    props: PropName[] | Set<PropName>,
    callback: C | Listener<C>,
    options?: ObserverOptions
  ): Listener<C> {
    if (!origin || typeof origin !== 'object') {
      throw new TypeError('origin must be a object')
    }
    if (Array.isArray(props)) props = new Set(props)
    if (props.size === 0) throw new TypeError('props must be a non-empty array or set')
    // 创建监听器
    const listener = this.createListener(callback, options)
    if (options?.batch === false || props.size === 1) {
      for (const prop of props) {
        this.addListener(origin, prop, listener, options?.batch)
      }
    } else {
      // 监听的属性名集合
      const onProps = Array.isArray(props) ? new Set(props) : props
      // 添加一个回调函数
      const remove = this.addNotBatchCallback(
        origin,
        microTaskDebouncedCallback(
          (keys: PropName[]) => {
            const changes: PropName[] = []
            // 过滤掉不在监听的属性名
            for (const key of new Set(keys)) {
              if (onProps.has(key)) changes.push(key)
            }
            // 如果有变化，则触发监听器
            if (changes.length) (listener as Listener).trigger(changes, origin)
          },
          (last, prev) => {
            if (!prev) return last
            prev[0].push(...last[0])
            return prev
          }
        )
      )
      // 监听器销毁时删除监听器
      listener.onDestroyed(remove)
    }
    return listener
  }

  /**
   * 注册不批量处理的回调函数
   *
   * 注册一个不进行批处理的回调函数用于处理数据变化，此方法为实现一些进阶的监听功能而存在。
   *
   * @param {AnyObject} origin - 监听源，一般是`ref`|`reactive`创建的对象
   * @param {AnyFunction} callback - 回调函数
   * @param prop - 属性名，默认为{@linkcode Observers.ALL_CHANGE_SYMBOL}标记，监听全部变化
   * @returns {Function} - 调用此函数可以删除注册的回调函数
   */
  static addNotBatchCallback<C extends AnyCallback>(
    origin: AnyObject,
    callback: C,
    prop: PropName = this.ALL_CHANGE_SYMBOL
  ): () => void {
    this.addListener(origin, prop, callback)
    return () => this.removeListener(origin, prop, callback, false)
  }
  /**
   * ## 同时注册给多个对象注册同一个监听器
   *
   * @param {AnyObject[]|Set<AnyObject>} origins - 监听源列表
   * @param {Function|Listener} callback - 回调函数或监听器实例
   * @param {ObserverOptions} options - 监听器选项
   * @returns {Listener} - 监听器实例
   */
  static registers<T extends AnyObject, C extends AnyCallback>(
    origins: Set<T> | T[],
    callback: C | Listener<C>,
    options?: ObserverOptions
  ): Listener<C> {
    if (Array.isArray(origins)) {
      origins = new Set(origins)
    }
    if (!(origins instanceof Set) || origins.size === 0) {
      throw new TypeError('origins must be a non-empty array or set')
    }
    const listener = this.createListener(callback, options)
    // 监听器列表
    for (const origin of origins) {
      this.addListener(origin, this.ALL_CHANGE_SYMBOL, listener, options?.batch)
    }
    // 如果监听器销毁了，则删除监听器
    listener.onDestroyed(() => {
      for (const origin of origins) {
        this.removeListener(origin, this.ALL_CHANGE_SYMBOL, listener, options?.batch)
      }
    })
    return listener
  }

  /**
   * 创建监听器，将callback转换为监听器实例
   *
   * @param callback - 回调函数或监听器实例
   * @param options - 监听器选项
   * @returns {{listener: Listener, store: WeakMap<object, PropListenerMap>}} - 监听器实例和储存商店
   */
  static createListener<C extends AnyCallback>(
    callback: C | Listener<C>,
    options?: ListenerOptions
  ): Listener<C> {
    // 创建监听器
    return isFunction(callback) ? new Listener(callback, options) : callback
  }

  /**
   * 获取观察的目标
   *
   * @param obj
   */
  static getObserveTarget<T extends AnyObject>(obj: T): T {
    return (Reflect.get(obj, this.OBSERVERS_TARGET_SYMBOL) as T) ?? obj
  }

  /**
   * ## 添加监听器
   *
   * @param {AnyObject} proxy - 监听源对象
   * @param {PropName} prop - 属性名
   * @param {Listener|AnyCallback} listener - 监听器实例
   * @param {boolean} [batch=true] - 是否为批量处理的监听器，默认为true
   */
  static addListener<C extends AnyCallback>(
    proxy: AnyObject,
    prop: PropName,
    listener: Listener<C> | C,
    batch: boolean = true
  ): void {
    // 获取存储容器
    const store = this.store(batch)

    // 获取观察目标对象
    const observeTarget = this.getObserveTarget(proxy)

    // 加锁操作
    const unLock = this.#lockWeakMap(observeTarget)

    try {
      // 检查观察目标对象是否已经存在于存储容器中
      if (!store.has(observeTarget)) {
        // 如果不存在，则为该对象创建一个新的 Map 用于存储属性和监听器集合
        store.set(observeTarget, new Map())
      }

      // 获取该对象对应的属性映射
      const propMap = store.get(observeTarget)!

      // 检查属性是否已经存在于属性映射中
      if (!propMap.has(prop)) {
        // 如果不存在，则为该属性创建一个新的 Set 用于存储监听器
        propMap.set(prop, new Set())
      }

      // 将监听器添加到对应的属性监听器集合中
      propMap.get(prop)!.add(listener)

      // 如果监听器是 Listener 实例，添加销毁回调
      if (listener instanceof Listener) {
        listener.onDestroyed(() => this.removeListener(observeTarget, prop, listener, batch))
      }
    } finally {
      // 无论是否发生错误，都要解锁
      unLock()
    }
  }

  /**
   * ## 删除监听器
   *
   * @param {AnyObject} proxy - 监听源对象
   * @param {PropName} prop - 属性名
   * @param {Listener|AnyCallback} listener - 监听器实例
   * @param {boolean} [batch=true] - 是否为批量处理的监听器，默认为true
   */
  static removeListener<C extends AnyCallback>(
    proxy: AnyObject,
    prop: PropName,
    listener: Listener<C> | AnyCallback,
    batch: boolean = true
  ): void {
    const store = this.store(batch)
    proxy = this.getObserveTarget(proxy)
    const unLock = this.#lockWeakMap(proxy)
    const set = store.get(proxy)?.get(prop)
    if (!set) return
    try {
      set.delete(listener)
      if (set.size === 0) store.get(proxy)?.delete(prop)
      if (store.get(proxy)?.size === 0) store.delete(proxy)
    } finally {
      unLock()
    }
  }

  /**
   * ## 处理触发队列
   *
   * @private
   */
  static #handleTriggerQueue() {
    // 恢复状态
    this.#isHanding = false
    const queue: Queue = this.#triggerQueue
    for (const [origin, props] of queue) {
      this.#triggerProps(origin, props)
    }
  }

  /**
   * 触发多个属性的监听器
   *
   * @param origin
   * @param props
   * @private
   */
  static #triggerProps(origin: AnyObject, props: Set<PropName>) {
    for (const prop of props) {
      this.#triggerListeners(this.#batchHandleListeners.get(origin)?.get(prop), origin, [prop])
    }
    // 兼容prop传入ALL_CHANGE_SYMBOL
    if (!props.has(this.ALL_CHANGE_SYMBOL)) {
      // 如果不存在ALL_CHANGE_SYMBOL的监听器，则触发它
      this.#triggerListeners(
        this.#batchHandleListeners.get(origin)?.get(this.ALL_CHANGE_SYMBOL),
        origin,
        Array.from(props)
      )
    }
  }

  /**
   * ## 触发监听器
   *
   * @private
   * @param listeners
   * @param origin
   * @param p
   */
  static #triggerListeners<T extends AnyObject>(
    listeners: Listeners | undefined,
    origin: T,
    p: ExtractProp<T>[]
  ): void {
    if (listeners?.size) {
      for (const listener of listeners) {
        if (typeof listener === 'function') {
          listener(p, origin)
        } else {
          listener.trigger(p, origin)
        }
      }
    }
  }

  /**
   * ## 将指定监听源映射锁定
   *
   * @param origin
   * @private
   */
  static #lockWeakMap(origin: AnyObject) {
    while (this.#weakMapLock.has(origin)) {}
    this.#weakMapLock.add(origin)
    return () => {
      this.#weakMapLock.delete(origin)
    }
  }
}
