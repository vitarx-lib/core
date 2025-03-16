import {
  Depend,
  type Deps,
  type ExtractProp,
  isProxy,
  isValueProxy,
  type PropName,
  type UnProxy
} from '../responsive/index.js'
import { Listener } from './listener.js'
import { type ObserverOptions, Observers } from './observers.js'
import { deepClone, isFunction, microTaskDebouncedCallback } from '../../utils/index.js'

// 提取监听源
type ExtractOrigin<T> = T extends AnyFunction ? ReturnType<T> : T
// 提取属性名称 联合类型
type ExtractPropName<T, O = ExtractOrigin<T>> = O extends object ? ExtractProp<O> : never
/** 监听对象变化的回调 */
type WatchChangeCallback<T> = (props: ExtractProp<T>[], origin: T) => void
/** 监听值变化的回调 */
type WatchValueCallback<T> = (newValue: UnProxy<T>, oldValue: UnProxy<T>) => void
// watch函数回调
type WatchCallback<T> = T extends AnyFunction
  ? WatchValueCallback<ReturnType<T>>
  : WatchChangeCallback<T>
// 监听回调
type Callback<P extends PropName[], T extends AnyObject> = (props: P, origin: T) => void
// 监听多个源时的回调
type WatchChangesCallback<T extends AnyObject> = Callback<ExtractPropName<T>[], T>
/**
 * 监听依赖结果
 */
type WatchDependResult<R> = {
  /**
   * 监听器，如果为undefined则代表没有收集到依赖
   */
  listener: Listener<VoidCallback> | undefined
  /**
   * 回调函数的返回值
   */
  result: R
  /**
   * 收集到的依赖
   */
  deps: Deps
}

/**
 * 创建值监听器
 *
 * @param origin - 监听源
 * @param prop - 属性名，不传入则克隆整个对象
 * @param callback - 回调函数
 * @param options - 监听器配置选项
 */
const createValueListener = <T extends AnyObject>(
  origin: T,
  prop: ExtractProp<T> | undefined,
  callback: WatchValueCallback<T>,
  options?: ObserverOptions
): Listener<() => void> => {
  let oldValue = deepClone(prop !== undefined ? origin[prop] : origin)
  return new Listener(() => {
    const newValue = deepClone(prop !== undefined ? origin[prop] : origin)
    callback(newValue as any, oldValue as any)
    oldValue = newValue
  }, options)
}

/**
 * ## 监听对象的所有属性变化
 *
 * 简单示例：
 *
 * ```ts
 * import { watch,reactive,ref } from 'vitarx'
 * const reactiveObj = reactive({a:1,b:2,c:{a:1}})
 * const refObj = ref({a:1})
 *
 * // 监听对象所有属性变化，下面的写法等效于
 * watch(reactiveObj,(props:keyof reactiveObj,origin: typeof reactiveObj)=>{
 *  // props 为变化的属性名数组，当options.batch为false时，props数组中永远只会存在一个元素
 *  console.log(`捕获到reactiveObj属性变化：${props.join(',')}`)
 * })
 *
 * // 监听值变化
 * watch(()=>reactiveObj.a,(newValue,oldValue)=>{
 *    // 第一个参数为新值，第二个参数为旧值
 * })
 * ```
 * **origin**合法类型如下：
 * - `object` ：任意实现了ProxySymbol的对象，一般是ref或reactive创建的响应式代理对象。也可以是一个实现了{@link ProxySymbol}接口中的标记属性的任意对象。
 * - `array` : 非Proxy数组，可以在数组中包含多个响应式代理对象达到同时监听多个对象变化的效果，但不能包含非响应式代理对象。
 * - `function`：如果返回的是一个基本类型值，例如：number|string|boolean|null...非对象类型的值，那函数的写法必须是`()=>obj.key`，会通过依赖收集监听对象的某个属性值变化，回调函数接收的参数也变为了新值和旧值，除了返回基本类型值，其他合法返回值同上述的`array`,`object`
 *
 * @template T - 监听源类型
 * @param {T} origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param {WatchCallback<T>} callback - 回调函数
 * @param {ObserverOptions} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watch<T extends AnyObject, C extends WatchCallback<T>>(
  origin: T,
  callback: C,
  options?: ObserverOptions
): Listener<T extends AnyFunction ? VoidCallback : WatchChangeCallback<T>> {
  if (isFunction(origin)) {
    let { listener, result } = watchDepend(
      origin,
      () => {
        const newResult = deepClone(origin())
        callback(newResult, result)
        result = newResult
      },
      options
    )
    if (listener) return listener as Listener<any>
    if (isProxy(result)) {
      return watchValue(result, callback, options) as Listener<any>
    }
    throw new TypeError('origin为getter时，没有收集到任何依赖')
  }
  if (isProxy(origin)) {
    return Observers.register(
      origin,
      callback,
      Observers.ALL_CHANGE_SYMBOL,
      options
    ) as Listener<any>
  }
  throw new TypeError(
    'origin参数无效，它可以是一个响应式对象，也可以是一个getter函数，如果为函数时则等同于调用watchDepend'
  )
}

/**
 * ## 监听多个源变化
 *
 * @example
 * ```ts
 * import { watchChanges,reactive,ref,microTaskDebouncedCallback } from 'vitarx'
 * const reactiveObj = reactive({a:1})
 * const refObj = ref({a:1})
 * watchChanges([reactiveObj,refObj],(props,origin)=>{
 *    // 其中任意一个对象变化都会触发此回调
 *    // origin是变化的对象，props是变化的属性名数组
 * })
 * refObj.value.a+++
 * refObj.value.a+++
 * reactiveObj.a+++
 *
 * // 上面这样修改数据，回调会触发两次，因为修改了不同的对象
 *
 * // 如果需要只触发一次，且不需要知道哪个对象变化了，可以使用微任务防抖函数实现
 * watchChanges([reactiveObj,refObj],microTaskDebouncedCallback(()=>{
 *     console.log('这样可以确保在同一个微任务中只执行一次回调')
 * }))
 * ```
 *
 * @param {array} origins - 监听源列表
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watchChanges<T extends AnyObject, C extends WatchChangesCallback<T>>(
  origins: Array<T>,
  callback: C | Listener<C>,
  options?: ObserverOptions
): Listener<C> {
  if (origins.length === 0) {
    throw new TypeError('origins参数不能是空数组，正确值示例：[Ref,Reactive,Computed,...]')
  }
  const deps = new Set(origins.filter(isProxy))
  if (deps.size === 0) {
    throw new TypeError(
      'origins数组中所有值都不是可监听的代理对象，正确值示例：[Ref,Reactive,Computed,...]'
    )
  }
  return Observers.registers(deps, callback, options)
}

/**
 * ## 监听响应式对象变化
 *
 * 对象改变之后和改变之前的值做为回调参数，值通过深度克隆，它们是两个不同的对象。
 *
 * > 注意：当监听源对象是值类型代理时（Ref或Computed），回调参数是`origin.value`的值，而非源对象的克隆。
 *
 * @param {object} origin - 要监听的对象，一般是`ref`|`reactive`创建的对象
 * @param {function} callback - 回调函数，第一个参数为`newValue`，第二个参数为`oldValue`
 * @param {object} options - 监听器配置选项
 * @returns {Listener} - 监听器实例
 */
export function watchValue<T extends AnyObject>(
  origin: T,
  callback: WatchValueCallback<T>,
  options?: ObserverOptions
): Listener<() => void> {
  if (isProxy(origin)) {
    // 处理值类型代理，让其返回value
    const prop = isValueProxy(origin) ? 'value' : undefined
    return Observers.register(
      origin,
      createValueListener(origin, prop as any, callback, options),
      Observers.ALL_CHANGE_SYMBOL,
      options
    )
  }
  throw new TypeError('origin参数无效，它必须是一个响应式对象。')
}

/**
 * ## 监听多个属性变化
 *
 * 该方法与{@linkcode watchPropChange}不同的之处是可以监听多个属性的变化，回调函数的第一个参数为是变化的属性名数组。
 *
 * @param {object} origin - 监听源，响应式对象
 * @param {string[]} props - 要监听的属性名数组
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watchPropsChange<
  T extends AnyObject,
  P extends ExtractProp<T>[] | Set<ExtractProp<T>>,
  C extends AnyCallback = Callback<ExtractProp<T>[], T>
>(origin: T, props: P, callback: C | Listener<C>, options?: ObserverOptions): Listener<C> {
  return Observers.registerProps(origin, props, callback, options)
}

/**
 * ## 监听代理对象的单个属性变化
 *
 * @param {object} origin - 监听源，响应式对象
 * @param {string} prop - 要监听的属性名
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watchPropChange<
  T extends AnyObject,
  P extends ExtractProp<T>,
  C extends AnyCallback = Callback<[P], T>
>(origin: T, prop: P, callback: C | Listener<C>, options?: ObserverOptions): Listener<C> {
  return Observers.register(origin, callback, prop, options)
}

/**
 * ## 监听响应式对象的某个属性值变化
 *
 * @param {object} origin - 监听源，一般是`ref`|`reactive`创建的对象
 * @param {string|symbol} prop - 要监听的属性名
 * @param {function} callback - 回调函数，第一个参数为`newValue`，第二个参数为`oldValue`
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watchPropValue<T extends AnyObject, P extends ExtractProp<T>>(
  origin: T,
  prop: P,
  callback: WatchValueCallback<T[P]>,
  options?: ObserverOptions
): Listener<() => void> {
  return Observers.register(
    origin,
    createValueListener(origin, prop, callback, options),
    prop,
    options
  )
}

/**
 * ## 监听函数的依赖变化
 *
 *
 * @note 该方法会监听函数的依赖，当依赖发生变化时，会触发回调函数，没有传入回调函数则触发传入的fn函数本身。
 *
 * @alias watchEffect
 * @param {function} fn - 要监听的函数
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 如果收集到依赖则返回监听器，否则返回undefined
 */
export function watchDepend<R>(
  fn: () => R,
  callback?: () => void,
  options?: ObserverOptions
): WatchDependResult<R> {
  const { deps, result } = Depend.collect(fn)
  let listener: Listener | undefined
  if (deps.size > 0) {
    callback = callback ?? fn
    if (typeof callback !== 'function') {
      throw new TypeError('callback参数必须为可调用的函数')
    }
    listener = new Listener(
      options?.batch === false ? () => callback!() : microTaskDebouncedCallback(() => callback!()),
      options
    )
    for (const [proxy, props] of deps) {
      Observers.registerProps(proxy, props, listener, { batch: false })
    }
  }
  return { listener, result, deps }
}

export { watchDepend as watchEffect }

/**
 * 在下一次微任务开始之前执行回调函数
 *
 * @param {function} cb - 回调函数
 * @returns {void}
 */
export function nextTick(cb: () => void): void
/**
 * 等待微任务队列执行完毕
 *
 * @returns {Promise<void>} - 返回Promise对象，可以使用await来等待任务完成
 */
export function nextTick(): Promise<void>
/**
 * 在微任务队列中执行回调，或返回一个Promise
 *
 * @param {function} [cb] - 可选回调函数
 * @returns {Promise<void>|void} - 如果传入回调，返回void；否则返回Promise对象
 */
export function nextTick(cb?: () => void): Promise<void> | void {
  if (cb) {
    Promise.resolve().then(cb)
  } else {
    return Promise.resolve()
  }
}
