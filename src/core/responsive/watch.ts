import { Listener, Observers } from './observer.js'
import { getProxyIndex, getProxyRoot, isProxy, isRef } from './proxy.js'
import { getIndexValue, isArray, isFunction } from '../utils'
import { Dep } from './track-dependencies'
import {
  AnyFunction,
  Callback,
  ChangeIndex,
  UnionOfValues,
  WatchCallback,
  WatchOptions,
  WatchSourceType
} from '../../types/watch'
// 事件标识
export const CHANGE_EVENT_SYMBOL = Symbol('VITARX_PROXY_CHANGE_EVENT_SYMBOL')
// 观察者标识
export const WATCHER_TAG_SYMBOL = Symbol('VITARX_PROXY_WATCHER_SYMBOL')
// 事件标识类型
export type EventName = string | typeof CHANGE_EVENT_SYMBOL

/**
 * 变量观察者管理器
 *
 * 内置微任务队列，自动合并相同事件，减少回调次数。
 *
 * @template T - 变量类型
 */
export class VariableObservers<T> {
  // 观察者列表
  #observers = new Observers<EventName>()
  // 不使用批处理的观察者
  #notBatchHandleObservers = new Observers<EventName>()
  // 微任务队列
  #triggerQueue: Array<{ event: EventName; params: any[] }> = []
  // 待触发队列
  #waitTriggerList: Map<EventName, any[]> = new Map()
  // 是否正在处理队列
  #isFlushing = false

  /**
   * 触发变量变化事件
   *
   * 逐级触发，从最内层开始触发，触发 change 事件，直到根对象。
   *
   * @param {ChangeIndex} index - 变化的变量索引
   * @param {T} newValue - 根对象的新值，源对象
   * @param {T} oldValue - 根对象的旧值，深度克隆
   */
  trigger(index: ChangeIndex, newValue: T, oldValue: T): void {
    // 如果不在微任务中，则开始处理队列
    if (!this.#isFlushing) {
      this.#isFlushing = true
      // 处理队列
      Promise.resolve().then(this.#flushTrigger.bind(this))
    }
    // 最外层索引
    let lastIndex: any
    // change事件冒泡
    while (index.length) {
      const event = indexToEvent(index)
      if (this.#observers.hasEvent(event) || this.#notBatchHandleObservers.hasEvent(event)) {
        // 获取旧值
        const old = getIndexValue(oldValue, index)
        const newVal = getIndexValue(newValue, index)
        // 当前层索引
        lastIndex = index.pop()
        this.#pushTrigger(event, [newVal, old, lastIndex, getIndexValue(newValue, index)])
      } else {
        lastIndex = index.pop()
      }
    }
    // 触发默认事件
    let params = isRef(newValue)
      ? [(newValue as any).value, (oldValue as any).value, lastIndex, newValue]
      : [newValue, oldValue, lastIndex, newValue]
    this.#pushTrigger(CHANGE_EVENT_SYMBOL, params)
  }

  /**
   * 注册监听器
   *
   * @template C - 回调函数类型
   * @param {ChangeIndex|ChangeIndex[]} index - 索引
   * @param {C} callback - 回调函数
   * @param options
   */
  register<C extends AnyFunction>(
    index: EventName | EventName[],
    callback: C | Listener<C>,
    options?: WatchOptions
  ): Listener<C> {
    if (options?.isBatch === false) {
      // 注册监听器
      return this.#notBatchHandleObservers.register(index, callback, options?.limit)
    } else {
      // 注册监听器
      return this.#observers.register(index, callback, options?.limit)
    }
  }

  /**
   * 推送触发事件到队列或立即触发
   *
   * @param event
   * @param params
   * @private
   */
  #pushTrigger(event: EventName, params: any[]) {
    if (this.#notBatchHandleObservers.hasEvent(event)) {
      this.#notBatchHandleObservers.trigger(event, params)
    }
    if (this.#observers.hasEvent(event)) {
      this.#triggerQueue.push({
        event: event,
        params: params
      })
    }
  }

  /**
   * 刷新触发队列
   *
   * @private
   */
  #flushTrigger() {
    while (this.#triggerQueue.length) {
      const trigger = this.#triggerQueue.shift()!
      const eventParams = this.#waitTriggerList.get(trigger.event)
      if (eventParams) {
        // 如果已经存在相同的事件，则更新参数
        eventParams[0] = trigger.params[0] // 更新新值
        eventParams[3] = trigger.params[3] // 更新源对象
      } else {
        // 如果不存在，则创建
        this.#waitTriggerList.set(trigger.event, trigger.params)
      }
    }
    // 遍历triggerList，触发事件
    for (const [event, data] of this.#waitTriggerList) {
      this.#observers.trigger(event, data)
    }
    // 清空 等待触发的事件
    this.#waitTriggerList.clear()
    // 恢复状态
    this.#isFlushing = false
  }
}

/**
 * index转换为事件标识
 *
 * @param {ChangeIndex} index
 */
export function indexToEvent(index: ChangeIndex): EventName {
  if (index.length === 0) {
    return CHANGE_EVENT_SYMBOL
  } else {
    return index.map((item) => item.toString()).join('.')
  }
}

/**
 * @see withWatcher
 */
export function withWatcher<T extends object>(
  proxy: T,
  create: false
): VariableObservers<T> | undefined

/**
 * @see withWatcher
 */
export function withWatcher<T extends object>(proxy: T, create?: true): VariableObservers<T>
/**
 * ## 获取观察者管理器
 *
 * 该方法会赋予对象观察者管理器，该管理器会记录所有事件观察者，并提供了trigger方法，触发事件。
 *
 * > **注意**：该方法提供给响应式代理对象内部实现观察者模式，请勿在外部进行调用。
 *
 * @template T - 代理对象类型
 * @param proxy - 代理对象
 * @param create - 不存在时是否创建观察者管理器，默认为 true
 */
export function withWatcher<T extends object>(
  proxy: T,
  create: boolean = true
): VariableObservers<T> | undefined {
  let watcher: VariableObservers<T> | undefined
  // 获取观察者管理器
  if ((proxy as any)[WATCHER_TAG_SYMBOL]) {
    watcher = (proxy as any)[WATCHER_TAG_SYMBOL]
  }
  // 创建观察者管理器
  else if (create) {
    watcher = new VariableObservers<T>()
    Object.defineProperty(proxy, WATCHER_TAG_SYMBOL, {
      value: watcher
    })
  }
  return watcher
}

/**
 * ## 监听数据变化
 *
 * @example
 * ```ts
 * import { ref, watch } from 'vitarx'
 * // 创建代理对象
 * const data = ref({name:'vitarx',address:{city:'guizhou'}})
 * // 监听对象变化
 * watch(data, (newValue, oldValue, index, source)) => {
 *  // index为改变的属性名，例如name
 *  console.log(newValue, oldValue) // 监听对象
 * })
 * // 只监听对象的指定属性变化
 * watch(()=>data.name, (newValue:string, oldValue:string, index:'name')) => {
 *  console.log(newValue, oldValue) // 监听对象某个属性，index为属性名
 * })
 * // 监听对象部分属性变化
 * watch(()=>[data.name,data.address], (newValue:string, oldValue:string, index:'name'|'address')) => {
 *  console.log(newValue, oldValue)
 * })
 * // 数组代理对象
 * const list = ref([1,2,3])
 * // 监听多个对象
 * watch(()=>[data,list], (newValue:string, oldValue:string, index:0|1)) => {
 *  console.log(newValue, oldValue)
 * })
 * // 基本类型的代理需要使用.value访问或修改
 * const str = ref('hello')
 * // 基本类型代理对象的监听回调的index为value，oldValue和newValue为实际目标值,source为代理对象本身
 * watch(str, (newValue:string, oldValue:string, index:'value', source:Ref<string>)) => {
 *  console.log(newValue, oldValue) // world , hello
 * })
 * str.value = 'world'
 * ```
 *
 * @template T 任意类型，但不能是异步函数
 * @template C 回调函数类型
 * @param {T} source - 监听源，可以是`对象`、`数组`、{@link watchReturnSource `函数`}
 * @param {C} callback - 回调函数
 * @param {WatchOptions} options - 监听选项
 * @param {boolean} options.isBatch - 是否批处理，合并触发，默认为true
 * @param {boolean} options.limit - 限制触发次数，默认为0，表示不限制触发次数
 * @returns {Listener<C>} 监听器，可以调用`destroy()`方法取消监听，以及`pause()`方法暂停监听，`unpause()`方法恢复监听...
 */
export function watch<T extends WatchSourceType, C extends WatchCallback = Callback<T>>(
  source: T,
  callback: C,
  options?: WatchOptions
): Listener<C> | undefined {
  if (isFunction(source)) {
    return watchFunc(source as AnyFunction, callback as any, options) as Listener<C>
  }
  if (isProxy(source)) {
    return withWatcher(source as object)!.register(
      indexToEvent(getProxyIndex(source)!),
      callback,
      options
    )
  } else if (isArray(source)) {
    const refs = new Set(source.filter(isProxy))
    if (refs.size) {
      // 创建监听器
      const listener = new Listener<C>(callback, options?.limit || 0)
      // 遍历源数组，获取代理对象
      refs.forEach((item) => {
        withWatcher(item).register(indexToEvent(getProxyIndex(item)!), listener, options)
      })
      return listener
    }
  }
  console.warn(
    `Vitarx.watch方法只能监听通过ref方法创建的响应式变量，请勿用于监听普通变量。\n如果监听源是对象的属性(例如：refObj.key)，请改用监听函数返回值的方式监听，示例：watch(()=>refObj.key,...)。`
  )
  return undefined
}

/**
 * ## 监听一次变化。
 *
 * 该方法是{@link watch watch()}的一个快捷方法，只会触发一次回调函数，触发后销毁监听器。
 *
 * @see watch
 */
export function watchOnce<T extends WatchSourceType, C extends WatchCallback = Callback<T>>(
  source: T,
  callback: C
): Listener<C> | undefined {
  return watch(source, callback, { limit: 1 })
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
 * @param {T} fn - 要监听的函数
 * @param {C} callback - 回调函数
 * @param {WatchOptions} options - 监听选项
 * @returns {Listener<C> | undefined} - 返回监听器，如果返回值是undefined，则表示监听失败
 * @see watch
 */
export function watchFunc<T extends AnyFunction, C extends AnyFunction = Callback<T>>(
  fn: T,
  callback: C,
  options?: WatchOptions
): Listener<C> | undefined {
  const source = fn()
  // 如果是响应式对象，则直接监听
  if (isProxy(source)) {
    return withWatcher(source as object).register(
      indexToEvent(getProxyIndex(source)!),
      callback,
      options
    )
  }
  if (isArray(source)) {
    // 空数组不监听
    if (source.length === 0) return undefined
    // 如果数组中包含响应对象，则监听响应对象
    if (source.filter(isProxy).length > 0) {
      return watch(source, callback, options)
    }
  }
  return watchDep(fn, callback, options) as Listener<C>
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
 * @param {WatchOptions} options - 监听选项
 * @returns {Listener<C | T> | undefined} - 返回监听器，如果返回值是undefined，则表示没有任何`依赖`。
 * @see watch
 */
export function watchDep(
  fn: AnyFunction,
  callback?: AnyFunction,
  options?: WatchOptions
): Listener<AnyFunction> | undefined {
  // 收集函数依赖的响应对象
  const deps = Dep.collect(fn, true)
  if (deps.size > 0) {
    const listener = new Listener(callback || fn, options?.limit)
    for (const [proxy, keys] of deps) {
      withWatcher(proxy).register(Array.from(keys), listener, options)
    }
    return listener
  }
  return undefined
}

/**
 * 监听代理对象的指定属性。
 *
 * @template T - 必须是对象或者数组。
 * @template KS - 要监听的键，可以是多个键值，例如：`['key1','key2']`
 * @template C - 回调函数类型
 * @param {T} proxy 代理对象
 * @param {KS} keys 要监听的键或数组索引
 * @param {C} callback 回调函数
 * @param {WatchOptions} options - 监听选项
 * @returns {Listener<C> | undefined} - 返回监听器，如果返回值是undefined，则表示监听失败。
 */
export function watchKeys<
  T extends Record<any, any> | any[],
  KS extends Array<keyof Vitarx.ExcludeProxySymbol<T>> = Array<keyof Vitarx.ExcludeProxySymbol<T>>,
  C extends AnyFunction = WatchCallback<
    UnionOfValues<Vitarx.ExcludeProxySymbol<T>, KS>,
    UnionOfValues<T, KS>,
    KS[number],
    T
  >
>(proxy: T, keys: KS, callback: C, options?: WatchOptions): Listener<C> | undefined {
  if (isProxy(proxy)) {
    const proxyIndex = getProxyIndex(proxy)!
    if (keys.length) {
      const ks = keys.map((key) => indexToEvent([...proxyIndex, key]))
      return withWatcher(proxy)!.register(ks, callback, options)
    }
  }
  return undefined
}

/**
 * ## 手动触发监听器
 *
 * 如果你更改了为深度代理的对象，则可以使用该方法触发监听器。
 *
 * @example
 * ```ts
 * import {ref,watch,watchKeys,trigger,reactive} from 'vitarx'
 *
 * // 创建一个不会自动深度代理的对象
 * const obj = ref({a:{b:1}},false)
 * // 监听根对象
 * watch(obj,()=>{
 *   console.log('obj changed')
 * })
 * // 只监听对象的指定属性
 * watchKeys(obj.value,['a'],()=>{
 *   console.log('obj.a changed')
 * })
 * // 监听嵌套对象属性
 * watchKeys(obj.value.a,['b'],()=>{
 *   console.log('obj.a.b changed')
 * })
 * obj.value.a.b = 2 // 修改嵌套对象的属性值，不会触发监听器，使用下面的方式手动触发
 * trigger(obj) // 只会触发 obj changed
 * // trigger(obj,['value','a']) 和 trigger(obj.value,['a']) 是等效的
 * trigger(obj.value,['a']) // 会触发 obj changed 和 obj.a changed
 * trigger(obj,['value','a','b']) // 会触发上面的三个监听器
 * ```
 *
 * @param {Vitarx.Ref<any>} proxy - 要触发的代理对象
 * @param {ChangeIndex} index - 触发的索引，空数组表示根节点。
 */
export function trigger(proxy: Vitarx.Proxy, index: ChangeIndex = []) {
  if (isProxy(proxy)) {
    const rootIndex = getProxyIndex(proxy) || []
    withWatcher(proxy).trigger([...rootIndex, ...index], getProxyRoot(proxy), getProxyRoot(proxy))
  }
}
