import { Listener, Observers } from './observer.js'
import { getProxyIndex, isPlainProxy, isProxy } from './proxy.js'
import { getIndexValue, isArray, isFunction } from '../utils'
import { Dep } from './track-dependencies'
import { AnyFunction, WatchCallback, WatchIndex } from '../../types/watch'
// 事件标识
const CHANGE_EVENT_SYMBOL = Symbol('VITARX_PROXY_CHANGE_EVENT_SYMBOL')
// 监听器标识
export const WATCHER_TAG_SYMBOL = Symbol('VITARX_PROXY_WATCHER_SYMBOL')
// 事件标识类型
type EventName = string | typeof CHANGE_EVENT_SYMBOL

/**
 * 变量观察者管理器
 *
 * 内置微任务队列，自动合并相同事件，减少回调次数。
 *
 * @template T - 变量类型
 */
export class VariableObservers<T> {
  #observers = new Observers<EventName>()
  #triggerQueue: Array<{ event: EventName; params: any[] }> = []
  #triggerList: Map<EventName, any[]> = new Map()
  #isFlushing = false

  /**
   * 触发变量变化事件
   *
   * 逐级触发，从最内层开始触发，触发 change 事件，直到根对象。
   *
   * @param {WatchIndex} index - 变化的变量索引
   * @param {T} newValue - 根对象的新值，源对象
   * @param {T} oldValue - 根对象的旧值，深度克隆
   */
  trigger(index: WatchIndex, newValue: T, oldValue: T) {
    let lastIndex: any
    // change事件冒泡
    while (index.length) {
      const event = this.#indexToEvent(index)
      if (index.length > 0) lastIndex = index.pop()
      if (this.#observers.hasEvent(event)) {
        this.#triggerQueue.push({
          event,
          params: [
            getIndexValue(newValue, index),
            getIndexValue(oldValue, index),
            lastIndex,
            newValue
          ]
        })
      }
    }
    // 默认事件，根对象变化事件
    if (this.#observers.hasEvent(CHANGE_EVENT_SYMBOL)) {
      if (isPlainProxy(newValue)) {
        // 普通代理对象，使用.value做为被更改的值
        this.#triggerQueue.push({
          event: CHANGE_EVENT_SYMBOL,
          params: [
            (newValue as Vitarx.PlainProxy<any>).value,
            (oldValue as Vitarx.PlainProxy<any>).value,
            lastIndex,
            newValue
          ]
        })
      } else {
        // 推送一个默认更新事件
        this.#triggerQueue.push({
          event: CHANGE_EVENT_SYMBOL,
          params: [newValue, oldValue, lastIndex, newValue]
        })
      }
    }
    if (!this.#isFlushing && this.#triggerQueue.length) {
      this.#isFlushing = true
      // 处理队列
      Promise.resolve().then(this.#flushTrigger.bind(this))
    }
  }

  /**
   * 注册监听器
   *
   * @template C - 回调函数类型
   * @param {WatchIndex|WatchIndex[]} index - 索引
   * @param {C} callback - 回调函数
   * @param {number} limit - 限制触发次数
   */
  register<C extends AnyFunction>(
    index: WatchIndex | WatchIndex[],
    callback: C | Listener<C>,
    limit: number = 0
  ): Listener<C> {
    let events
    const isMultipleArrays = Array.isArray(index[0])
    // 处理多事件
    if (isMultipleArrays) {
      events = index.map((item) => this.#indexToEvent(item as WatchIndex))
    } else {
      // 处理单个事件
      events = this.#indexToEvent(index as WatchIndex)
    }
    // 注册监听器
    return this.#observers.register(events, callback, limit)
  }

  /**
   * 刷新触发队列
   *
   * @private
   */
  #flushTrigger() {
    while (this.#triggerQueue.length) {
      const trigger = this.#triggerQueue.shift()!
      // 如果已经存在相同的事件，则更新参数
      const eventParams = this.#triggerList.get(trigger.event)
      if (eventParams) {
        eventParams[0] = trigger.params[0]
      } else {
        this.#triggerList.set(trigger.event, trigger.params)
      }
    }
    // 遍历triggerList，触发事件
    for (const [event, data] of this.#triggerList) {
      this.#observers.trigger(event, data)
    }
    // 清空 triggerList
    this.#triggerList.clear()
    // 恢复状态
    this.#isFlushing = false
  }

  /**
   * 将 index 转换为事件标识
   *
   * @param index - 索引，如果为空则触发默认事件
   * @private
   */
  #indexToEvent(index: WatchIndex): EventName {
    if (index.length === 0) {
      return CHANGE_EVENT_SYMBOL
    } else {
      return index.map((item) => item.toString()).join('.')
    }
  }
}

/**
 * ## 获取观察者管理器
 *
 * 不存在则创建。
 *
 * 该方法会赋予对象观察者管理器，该管理器会记录所有事件观察者，并提供了trigger方法，触发事件。
 *
 * > **注意**：该方法提供给响应式代理对象内部实现观察者模式，请勿在外部进行调用。
 *
 * @template T - 代理对象类型
 * @param proxy - 代理对象
 */
export function getWatcher<T extends object>(proxy: T): VariableObservers<T> {
  let watcher
  // 获取观察者管理器
  if ((proxy as any)[WATCHER_TAG_SYMBOL]) {
    watcher = (proxy as any)[WATCHER_TAG_SYMBOL]
  }
  // 创建观察者管理器
  else {
    watcher = new VariableObservers<T>()
    Object.defineProperty(proxy, WATCHER_TAG_SYMBOL, {
      value: new VariableObservers<T>()
    })
  }
  return watcher
}

/**
 * 监听数据变化
 *
 * ```ts
 * import { ref, watch } from 'vitarx'
 * // 创建代理对象
 * const data = ref({name:'vitarx',address:{city:'guizhou'}})
 * // 监听对象变化
 * watch(data, (newValue, oldValue, index:undefined)) => {
 *  console.log(newValue, oldValue) // 监听对象，index固定为undefined
 * })
 * // 只监听对象的某个属性变化
 * watch(()=>data.name, (newValue:string, oldValue:string, index:'name')) => {
 *  console.log(newValue, oldValue) // 监听对象某个属性，index为属性名
 * })
 * // 只监听对象指定的属性变化
 * watch(()=>[data.name,data.address], (newValue:string, oldValue:string, index:'name'|'address')) => {
 *  console.log(newValue, oldValue)
 * })
 * ```
 *
 * @template T 任意类型，但不能是异步函数
 * @template C 回调函数类型
 * @param {T} source - 监听源，可以是`对象`、`数组`、{@link watchFunc `函数`}
 * @param {C} callback - 回调函数
 * @param limit - 限制触发次数,默认为0，表示不限制触发次数
 */
export function watch<T, C extends AnyFunction = WatchCallback<T>>(
  source: T,
  callback: C,
  limit: number = 0
): Listener<C> | undefined {
  if (isFunction(source)) {
    return watchReturnSource(source as AnyFunction, callback as any, limit) as Listener<C>
  }
  if (isProxy(source)) {
    return getWatcher(source as object).register([], callback, limit)
  } else if (isArray(source)) {
    const WATCH_INDEX = Symbol('WATCH_INDEX')
    // 代理数组
    let refs: any[] = []
    // 创建监听器
    let listener = new Listener<C>(
      function (n: any, o: any, i: any, s: any) {
        const index = s?.[WATCH_INDEX]
        callback(n, o, index === undefined ? i : index, s)
      } as C,
      limit
    )
    listener.onDestroyed(() => {
      // 删除索引
      refs.forEach((item) => {
        try {
          delete item[WATCH_INDEX]
        } catch (e) {
          console.error('Vitarx.watch.error', e)
        }
      })
      // @ts-ignore
      refs = undefined
      // @ts-ignore
      listener = undefined
      // @ts-ignore
      source = undefined
      // @ts-ignore
      callback = undefined
    })
    // 遍历源数组，获取代理对象
    source.forEach((item, i) => {
      if (isProxy(item) && !refs.includes(item)) {
        refs[i] = item
        Object.defineProperty(item, WATCH_INDEX, {
          value: i,
          configurable: true
        })
        const watcher = getWatcher(item)
        watcher.register([], listener)
      }
    })
    if (refs.length) {
      return listener
    } else {
      listener.destroyed()
      // @ts-ignore
      listener = undefined
    }
  }
  console.warn('Vitarx.watch方法只能监听通过ref方法创建的响应式变量，请勿用于监听普通变量。')
  return undefined
}

/**
 * ## 监听一次变化。
 *
 * 该方法是{@link watch watch()}的一个快捷方法，只会触发一次回调函数，触发后销毁监听器。
 *
 * @see watch
 */
export function watchOnce<T, C extends AnyFunction = WatchCallback<T>>(
  source: T,
  callback: C
): Listener<C> | undefined {
  return watch(source, callback, 1)
}

/**
 * ## 监听函数返回值
 *
 * 该方法是{@link watch watch()}方法的一个分支，和调用`watch(source: ()=>any,...)`是一样的效果。
 *
 * 函数返回值可以是：
 * * 包含多个响应式对象的数组，例如：`[refObject1,refObject2,...]`
 * * 包含多个响应式对象属性的数组，例如：`[refObject1.key1,refObject1.key2,...]`|`[refObject1.key,refObject2.key,...]`
 * * 单个响应式对象，例如：`refObject`
 * * 单个响应式对象属性，例如：`refObject.key`
 *
 * > **注意**：如果该方法的返回值不包含响应式对象，则会使用`watchDep`方法监听其依赖，
 * 例如`()=>refObject.key`这样的反回值不是响应式对象而是对象的属性值，则等于是调用的{@link watchDep watchDep()}。
 *
 * @template T - 函数类型
 * @template C - 回调函数类型
 * @param fn - 要监听的函数
 * @param callback - 回调函数
 * @param limit - 限制触发次数,默认为0，表示不限制触发次数
 * @returns {Listener<C> | undefined} - 返回监听器，如果返回值是undefined，则表示监听失败
 * @see watch
 */
export function watchReturnSource<T extends AnyFunction, C extends AnyFunction = WatchCallback<T>>(
  fn: T,
  callback: C,
  limit: number = 0
): Listener<C> | undefined {
  const source = fn()
  // 如果是响应式对象，则直接监听
  if (isProxy(source)) {
    return getWatcher(source as object).register([], callback, limit)
  }
  if (isArray(source)) {
    // 空数组不监听
    if (source.length === 0) return undefined
    // 如果数组中包含响应对象，则监听响应对象
    if (source.filter(isProxy).length > 0) {
      return watch(source, callback, limit)
    }
  }
  return watchDep(fn, callback, limit) as Listener<C>
}

/**
 * ## 监听函数`依赖`
 *
 * `依赖`代表函数内部调用的`响应式`变量。
 *
 * @template T - 函数类型
 * @template C - 回调函数类型
 * @param {T} fn - 要解析依赖的函数
 * @param {C} callback - 回调函数，可选的，如果不传则使用`fn`做为回调函数。
 * @param {number} limit - 限制触发次数,默认为0，表示不限制触发次数
 * @returns {Listener<C | T> | undefined} - 返回监听器，如果返回值是undefined，则表示没有任何`依赖`。
 */
export function watchDep<T extends AnyFunction, C extends AnyFunction>(
  fn: T,
  callback?: C,
  limit: number = 0
): Listener<C | T> | undefined {
  // 收集函数依赖的响应对象
  const deps = Dep.collect(fn)
  if (deps.size > 0) {
    const listener = new Listener(callback || fn, limit)
    for (const [proxy, keys] of deps) {
      const watcher = getWatcher(proxy)
      if (keys.has(undefined)) {
        watcher.register([], listener)
      } else {
        const rootIndex = getProxyIndex(proxy)!
        const index: WatchIndex[] = []
        keys.forEach((key) => index.push([...rootIndex, key!]))
        watcher.register(index, listener)
      }
    }
    return listener
  }
  return undefined
}
