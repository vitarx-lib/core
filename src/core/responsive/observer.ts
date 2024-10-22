// noinspection JSUnusedGlobalSymbols

type VoidCallback = () => void
type EventName = string | number | symbol
export type AnyCallback = (...args: any) => any

/**
 * 监听器
 *
 * @template C - 回调函数的类型
 */
export class Listener<C extends AnyCallback> {
  // 监听回调函数
  readonly #callback: C
  // 限制触发次数
  readonly #limit: number
  // 已触发次数
  #count: number = 0
  // 暂停状态
  #pause = false
  // 弃用状态
  #isDispose: boolean = false
  // 销毁回调
  #onDestroyedCallback?: VoidCallback[]

  /**
   * 创建监听器
   *
   * @template C - 回调函数的类型
   * @param {C} callback - 回调函数
   * @param {number} limit - 限制触发次数，0为不限制
   */
  constructor(callback: C, limit: number = 0) {
    this.#callback = callback
    this.#limit = limit
  }

  /**
   * 判断是否已被弃用
   *
   * @readonly
   */
  get isDispose() {
    return this.#isDispose
  }

  /**
   * 判断是否为暂停状态
   */
  get isPaused(): boolean {
    return this.#pause
  }

  /**
   * 已触发次数
   *
   * @returns {number}
   */
  get count(): number {
    return this.#count
  }

  /**
   * 获取限制触发次数
   *
   * @returns {number}
   */
  get limit(): number {
    return this.#limit
  }

  /**
   * 创建一个只触发一次的监听器
   *
   * @template C - 回调函数的类型
   *
   * @param {C} callback - 回调函数
   *
   * @returns {Listener<C>}
   */
  static once<C extends AnyCallback>(callback: C): Listener<C> {
    return new Listener(callback, 1)
  }

  /**
   * 销毁/弃用监听器
   *
   * 调用此方法会将监听器标记为弃用状态，并触发销毁回调。
   */
  destroyed(): void {
    // 放入宏任务中执行，防止微任务中执行
    setTimeout(() => {
      if (!this.#isDispose) {
        this.#isDispose = true
        if (!this.#onDestroyedCallback) return
        this.#onDestroyedCallback.forEach((callback) => {
          try {
            callback()
          } catch (e) {}
        })
        this.#onDestroyedCallback = undefined
      }
    }, 0)
  }

  /**
   * 监听销毁
   *
   * @param callback
   */
  onDestroyed(callback: VoidCallback): void {
    if (this.#isDispose) {
      callback()
    } else {
      if (this.#onDestroyedCallback) {
        this.#onDestroyedCallback.push(callback)
      } else {
        this.#onDestroyedCallback = [callback]
      }
    }
  }

  /**
   * 触发监听，如果监听器被销毁，则返回false
   *
   * > **注意**：该方法由ProxyHandler自动调用，如果是手动触发，需谨慎使用。
   *
   * @param {any[]} params - 要传给回调函数的参数列表
   * @returns {boolean} 返回一个bool值表示当前监听器是否还具有效应
   */
  trigger(params: Parameters<C>): boolean {
    if (this.#isDispose) return false
    if (this.#pause) return true
    // 如果没有限制触发次数或触发次数小于限制次数则触发回调
    if (this.#limit == 0 || this.#count < this.#limit) {
      try {
        this.#callback.apply(null, params)
      } catch (e) {
        console.error('Observer.Callback.Error', e)
      }
      this.#count++
      // 判断是否已达到预期的监听次数
      if (this.#limit != 0 && this.#count >= this.#limit) {
        this.destroyed()
        return false
      }
      return true
    } else {
      return false
    }
  }

  /**
   * 暂停回调
   *
   * 调用此方法过后，trigger方法会忽略回调，直到unpause方法被调用
   */
  pause() {
    // 放入宏任务中执行，防止微任务中执行
    setTimeout(() => (this.#pause = true), 0)
  }

  /**
   * 取消暂停回调
   *
   * 调用此方法后，如果之前处于暂停状态，则继续触发回调。
   */
  unpause() {
    setTimeout(() => (this.#pause = false), 0)
  }

  /**
   * 重置已触发的次数
   *
   * 如果已被销毁，则返回false
   *
   * @returns {boolean} 重置成功返回true，否则返回false。
   */
  reset(): boolean {
    if (this.#isDispose) return false
    this.#count = 0
    return true
  }
}

/**
 * 观察者管理器
 */
export class Observers<E extends EventName = EventName> {
  #listeners: Map<E, Listener<AnyCallback>[]> = new Map()

  /**
   * 注册事件观察者
   *
   * @template C - 回调函数的类型
   * @template E - 事件类型
   * @param {C|Listener<C>} callback - 回调函数或监听器
   * @param {E[] | E} events - 事件，如果为数组，则认为是同时监听多个事件
   * @param {number} limit - 限制触发次数，0为不限制，仅适用于回调函数
   * @returns {Listener<C>} - 返回监听器
   */
  register<C extends AnyCallback>(
    events: E[] | E,
    callback: C | Listener<C>,
    limit: number = 0
  ): Listener<C> {
    let listener: Listener<any>
    if (callback instanceof Listener) {
      listener = callback
    } else {
      listener = new Listener(callback, limit)
    }
    if (Array.isArray(events)) {
      events.forEach((e) => this.register(e, listener, limit))
    } else {
      this.#pushEventListener(events, listener)
      // 如果监听器销毁了，则删除监听器
      listener.onDestroyed(() => {
        this.#listeners.get(events)?.splice(this.#listeners.get(events)!.indexOf(listener), 1)
      })
    }
    return listener
  }

  /**
   * 触发事件
   *
   * @template E - 事件类型
   * @param {E[] | E} events - 事件
   * @param {any[]} params - 要传给回调函数的参数列表
   * @param {boolean} dispose - 是否弃用并销毁监听器(强制销毁)
   */
  trigger(events: E[] | E, params: any[] = [], dispose: boolean = false): void {
    if (Array.isArray(events)) {
      for (const i of events) {
        this.trigger(i, params, dispose)
      }
    } else {
      const listeners = this.#listeners.get(events)
      if (listeners) {
        listeners.forEach((listener) => {
          const isDispose = listener.trigger(params)
          if (dispose && isDispose) {
            listener.destroyed()
          }
        })
      }
    }
  }

  /**
   * 判断是否存在事件监听器
   *
   * @param event
   * @protected
   */
  hasEvent(event: E): boolean {
    return this.#listeners.has(event) && this.#listeners.get(event)!.length > 0
  }

  // 添加观察者
  #pushEventListener(event: E, listener: Listener<any>) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event)!.push(listener)
    } else {
      this.#listeners.set(event, [listener])
    }
  }
}
