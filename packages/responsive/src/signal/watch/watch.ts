import {
  AnyCallback,
  AnyCollection,
  AnyFunction,
  AnyObject,
  deepClone,
  isArray,
  isFunction,
  VoidCallback
} from '@vitarx/utils'
import { Depend } from '../../depend/index.js'
import {
  type ChangeCallback,
  SubManager,
  Subscriber,
  type SubscriberOptions
} from '../../observer/index.js'
import { SignalManager } from '../manager.js'
import type { ProxySignal, RefSignal } from '../types/index.js'
import { isRefSignal, isSignal, type SignalToRaw } from '../utils/index.js'

/** 从类型中排除信号标识符 */
export type ExcludeSignalSymbol<T> = Exclude<
  T,
  Extract<keyof ProxySignal | keyof RefSignal, symbol>
>
/**
 * 提取出监听目标可被监听的属性
 *
 * @template T 目标类型
 * @example
 * ```ts
 * WatchProperty<RefSignal> // value // ref信号只会触发value变化
 * WatchProperty<AnyCollection>> // size，集合类型只会触发size变化
 * WatchProperty<ProxySignal<[]> | RefSignal<[]>> // `${number}` | length  数组类型的会触发数组长度和数组指定下标变化
 * WatchProperty<ProxySignal> // keyof T 对象类型会触发对象属性变化
 * ```
 */
export type CanWatchProperty<T> = T extends AnyCollection
  ? 'size'
  : T extends RefSignal
    ? 'value'
    : T extends any[]
      ? `${number}` | 'length'
      : ExcludeSignalSymbol<keyof T>

export interface WatchOptions extends Omit<SubscriberOptions, 'paramsHandler'> {
  /**
   * 克隆新旧值
   *
   * 此选项为解决监听源是对象时，由于对象是引用传递，
   * 导致不能区分出新值和旧值的变化，可以将此选项配置`true`来深度克隆对象。
   *
   * 注意：深度克隆操作存在额外的性能开销，需注意运行时的性能。
   *
   * @default false
   */
  clone?: boolean
  /**
   * 立即执行一次回调
   *
   * @default false
   */
  immediate?: boolean
}

/**
 * 监听信号变化的回调函数类型
 *
 * 当被监听的信号或计算函数发生变化时，此回调函数将被触发执行。
 * 回调接收新值、旧值以及清理函数注册器，可用于管理副作用资源。
 *
 * @template T - 监听源的类型
 * @param {SignalToRaw<T>} newValue - 信号的新值，已经转换为原始类型
 * @param {SignalToRaw<T>} oldValue - 信号的旧值，已经转换为原始类型
 * @param {(handler: VoidCallback) => void} onCleanup - 注册清理函数的方法
 *   - 传入的清理函数将在下次回调触发前或监听被销毁时执行
 *   - 用于释放资源，如定时器、事件监听器等
 * @returns {void} - 回调函数不需要返回值
 *
 * @example
 * ```ts
 * // 使用清理函数管理资源
 * watch(signal, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => console.log(newVal), 1000)
 *   onCleanup(() => clearTimeout(timer)) // 自动清理定时器
 * })
 * ```
 */
export type WatchCallback<T> = (
  newValue: SignalToRaw<T>,
  oldValue: SignalToRaw<T>,
  onCleanup: (handler: VoidCallback) => void
) => void
/**
 * 监听属性变化的回调函数
 *
 * @template T 信号对象类型
 * @template P 监听的属性
 * @param {CanWatchProperty<T>[]} props 变化的属性列表，根据不同信号类型会有不同的可监听属性
 * @param {T} signal 监听的信号对象，即原始被监听的对象
 * @returns {void}
 * @example
 * ```ts
 * // 回调函数示例
 * const callback = (changedProps, signal) => {
 *   console.log('变化的属性:', changedProps);
 *   console.log('信号源:', signal);
 * }
 * ```
 */
export type WatchPropertyCallback<T, P> = (
  props: P extends Set<infer U> ? Array<U> : P extends Array<any> ? P : [P],
  signal: T
) => void

/**
 * 复制值，支持深度克隆
 *
 * @template T - 源对象的类型
 * @param {T} obj - 源对象
 * @param {keyof T | undefined} key - 要获取的属性键，如果为undefined则返回整个对象
 * @param {boolean} clone - 是否深度克隆值
 * @returns {any} - 复制后的值
 */
function copyValue<T extends AnyObject>(obj: T, key: keyof T | undefined, clone: boolean): any {
  const value = key ? obj[key as keyof T] : obj
  return clone ? deepClone(value) : value
}

/**
 * 监听信号变化并响应其更新
 *
 * 该函数提供了一种声明式的方式来观察响应式信号的变化。它可以监听信号对象或副作用函数，
 * 并在值发生变化时执行回调。支持自动清理资源和依赖追踪。
 *
 * @template T - 监听源类型，可以是对象或函数
 * @template C - 回调函数类型
 * @param {T} source - 监听源对象或函数
 *   - 当传入信号对象时：直接监听该信号的变化
 *   - 当传入函数时：优先监听函数内部依赖的信号变化，若无依赖则监听函数返回值
 * @param {C} callback - 变化时触发的回调函数
 *   - 接收新值、旧值作为参数
 *   - 通过第三个参数可注册清理函数，用于释放资源
 * @param { WatchOptions } [options] - 监听器配置选项
 * @param { string } [options.flush='default'] - 执行模式，可选值有 'default' | 'pre' | 'post' | 'sync'
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 * @param { boolean } [options.clone=false] - 是否深度克隆新旧值（解决对象引用无法辨别差异问题）
 * @param { boolean } [options.immediate=false] - 立即执行一次回调
 * @returns { Subscriber<VoidCallback> } - 返回订阅者实例，可用于手动取消监听
 * @throws { TypeError } - 当参数类型不正确或监听源无效时抛出类型错误
 *
 * @example
 * ```ts
 * // 监听ref信号
 * const count = ref(0)
 * const unwatch = watch(count, (newVal, oldVal) => {
 *   console.log(`Count changed from ${oldVal} to ${newVal}`)
 * })
 *
 * // 监听proxy信号
 * const obj = reactive({ count: 0 })
 * watch(obj, (newVal, oldVal) => {
 *   console.log(`Count changed from ${oldVal.count} to ${oldVal.count}`)
 * })
 *
 * // 监听多个信号
 * watch([count, obj], ([newCount, newObj], [oldCount, oldObj]) => {
 *   console.log(`count or obj changed`)
 * })
 *
 * // 监听函数返回值变化，函数内部必须具有响应式信号的使用，且不能是异步的
 * watch(() => count.value * 2, (newVal) => {
 *   console.log(`Doubled count is now: ${newVal}`)
 * })
 *
 * // 使用清理函数
 * watch(obj, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => {}, 1000)
 *   onCleanup(() => clearTimeout(timer)) // 在下次触发前或取消监听时调用
 * })
 *
 * // 克隆新旧值，需注意性能开销
 * watch(obj, (newVal, oldVal) => {
 *   // 解决监听源是对象时新旧值引用地址相同，无法辨别新旧对象差异的问题
 *   console.log(newVal === oldVal) // false，因为新值和旧值并非同一个对象，它们已被深度克隆拷贝
 * }, { clone: true })
 * ```
 */
export function watch<
  T extends AnyObject | AnyFunction, // 定义泛型 T，可以是对象或函数类型
  C extends WatchCallback<T extends AnyFunction ? ReturnType<T> : T> // 定义回调函数类型 CB
>(source: T, callback: C, options?: WatchOptions): Subscriber<VoidCallback> {
  if (!isFunction(callback)) throw new TypeError('callback is not a function')
  const { clone = false, immediate = false, ...subscriptionOptions } = options ?? {}
  // 监听目标
  let target = source
  // 清理函数
  let cleanupFn: AnyFunction | undefined
  // 缓存值
  let cacheValue: (T extends AnyFunction ? ReturnType<T> : SignalToRaw<T>) | undefined
  const onCleanup = (handler: VoidCallback) => {
    if (typeof handler !== 'function') {
      throw new TypeError('onCleanup handler it must be a function')
    }
    cleanupFn = handler
  }
  const clean = () => {
    if (cleanupFn) {
      cleanupFn()
      cleanupFn = undefined
    }
  }
  // 如果是函数，则监听函数返回值
  if (isFunction(source)) {
    let { subscriber, result: cacheRunResult } = Depend.subscribe(
      source,
      () => {
        // 获取新的返回值
        const newRunResult = source()
        // 如果返回值没有变化，则不执行回调
        if (cacheRunResult === newRunResult) return
        // 将新的运行结果赋值给缓存
        cacheRunResult = newRunResult
        // 克隆运行结果
        const newValue = clone ? deepClone(newRunResult) : newRunResult
        // 获取旧值
        const oldValue = cacheValue!
        // 更新缓存
        cacheValue = newValue
        callback(newValue, oldValue, onCleanup)
      },
      subscriptionOptions
    )
    if (subscriber) {
      cacheValue = clone ? deepClone(cacheRunResult) : cacheRunResult
      return subscriber.onDispose(clean)
    }
    target = cacheRunResult
  }
  // 处理信号
  if (isSignal(target)) {
    // 处理值类型代理，让其返回value
    const prop = isRefSignal(target) ? ('value' as keyof T) : undefined
    cacheValue = copyValue(target, prop, clone)
    const subscriber = new Subscriber(() => {
      clean()
      const newValue = copyValue(target, prop, clone)
      const oldValue = cacheValue!
      cacheValue = newValue
      callback(newValue, oldValue, onCleanup)
    }, subscriptionOptions)
    if (immediate) subscriber.trigger()
    return SubManager.subscribe(target, subscriber, subscriptionOptions).onDispose(clean)
  }
  // 处理多数组监听源
  if (isArray(target)) {
    const targets = [...target]
    const handler = () => {
      clean()
      const newValue = (clone ? deepClone(targets) : targets) as any
      const oldValue = cacheValue!
      cacheValue = newValue
      callback(newValue, oldValue, onCleanup)
    }
    const watchIndex: number[] = []
    // 添加父级
    for (let i = 0; i < targets.length; i++) {
      const signal = targets[i]
      if (!isSignal(signal)) continue
      watchIndex.push(i)
      SignalManager.bindParent(signal, targets, i)
    }
    if (watchIndex.length === 0) {
      throw new TypeError(
        'If the source parameter is passed into a normal array, the array contains at least one signal object that can be listened to'
      )
    }
    cacheValue = (clone ? deepClone(targets) : targets) as any
    const subscriber = new Subscriber(handler, subscriptionOptions).onDispose(() => {
      for (const index of watchIndex) {
        SignalManager.unbindParent(targets[index], targets as any, index)
      }
    })
    SubManager.addSubscriber(targets, SubManager.ALL_PROPERTIES_SYMBOL, subscriber)
    if (immediate) subscriber.trigger()
    return subscriber
  }
  throw new TypeError(
    'The source parameter can only be a valid signal object, or a function with side effects, an array with a signal object'
  )
}

/**
 * 监听多个信号变化
 *
 * `watchChanges` 是 `SubManager.subscribes` 方法的一个函数门面封装。
 * 它可以同时监听多个响应式对象的变化，并在变化时执行回调函数。
 *
 * @template T - 目标对象的类型，必须继承自 AnyObject
 * @template C - 回调函数的类型，必须继承自 ChangeCallback<T>
 *
 * @param { T[] } targets - 要监听的目标数组
 * @param { function } callback - 回调函数，接收两个参数：
 *   - props: 被修改的属性名数组
 *   - target: 最后一次被修改的信号对象
 * @param { WatchOptions } [options] - 监听器配置选项
 * @param { string } [options.flush='default'] - 执行模式，可选值：
 *   - 'default': 默认模式，按顺序触发，合并多次触发
 *   - 'pre': 在组件更新前执行
 *   - 'post': 在组件更新后执行
 *   - 'sync': 同步执行，每次变化都会立即触发
 * @param { number } [options.limit=0] - 触发次数限制，0表示无限制
 * @param { boolean } [options.scope=true] - 是否自动添加到当前作用域
 *
 * @returns {object} 监听器实例，包含以下方法：
 *   - destroy(): 销毁监听器
 *   - pause(): 暂停监听
 *   - resume(): 恢复监听
 *
 * @example
 * ```ts
 * import { watchChanges,reactive,ref } from 'vitarx'
 * const reactiveObj = reactive({a:1})
 * const refObj = ref({a:1})
 *
 * // 基本使用
 * watchChanges([reactiveObj,refObj],(props,target)=>{
 *    // target是最后一次被修改的信号对象，props则是被修改的属性值数组
 *    console.log(`被修改的属性名：${props.join('，')}，isRefObj：${target === refObj}`)
 * })
 *
 * // 同步调度
 * watchChanges([reactiveObj,refObj],(props,target)=>{
 *   // 数组中的任意对象被修改都会触发，连续修改会连续触发，而不是只在最后一次后触发
 * },{
 *   flush:'sync'
 * })
 *```
 *
 * @see SubManager.subscribes
 */
export function watchChanges<T extends AnyObject, C extends ChangeCallback<T>>(
  targets: Array<T> | Set<T>,
  callback: C,
  options?: SubscriberOptions<C>
): Subscriber<C> {
  return SubManager.subscribes(targets, callback, options)
}

/**
 * 监听属性变化（支持多个属性）
 *
 * `watchProperty` 是 `SubManager.subscribeProperties` 和 `SubManager.subscribeProperty` 方法的一个函数门面封装。
 *
 * 它和 `watch` 存在不同之处，它不会记录新值和旧值，只关注哪些属性发生了变化。
 * 可以同时监听多个属性，当任意属性发生变化时触发回调。
 *
 * @template T 目标对象类型，必须是一个对象类型
 * @template P 属性列表类型，可以是单个属性、属性数组或Set集合
 * @template C 回调函数类型，默认为WatchPropertyCallback<T>
 *
 * @param {T} signal - 目标对象，被监听的信号源
 * @param {P} properties - 属性列表，指定要监听的属性，集合类型只能监听size
 *   - 可以是单个属性名
 *   - 可以是属性名数组
 *   - 可以是属性名Set集合
 * @param {C} callback - 回调函数，当指定的属性发生变化时被调用
 * @param {WatchOptions} [options] - 监听器配置选项
 * @param {number} [options.limit=0] - 限制触发次数，0表示不限制
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域（自动销毁）
 * @param {boolean} [options.immediate=false] - 立即执行一次回调
 * @returns {Subscriber<C>} - 返回订阅者实例，可用于管理订阅生命周期
 * @example
 * ```ts
 * // 监听单个属性
 * const obj = reactive({ name: 'John', age: 30 });
 * const sub = watchProperty(obj, 'name', (props, obj) => {
 *   console.log(`属性 ${props[0]} 已变更`); // 变化的属性列表长度始终为1，['name']
 * });
 * // 取消订阅
 * sub.dispose();
 *
 * // 监听多个属性
 * const sub2 = watchProperty(obj, ['name', 'age'], (props, obj) => {
 *   console.log(`属性 ${props[0]} 已变更`); // 变化的属性列表长度始终为1，['name'|'age']
 * });
 *
 * // 使用Set集合监听属性
 * const propsToWatch = new Set(['name', 'age']);
 * const sub3 = watchProperty(obj, propsToWatch, (props, obj) => {
 *   console.log(`属性 ${props[0]} 已变更`); // 变化的属性列表长度始终为1，['name'|'age']
 * });
 *
 * // 如果需要回调的props能记录同一事件循环内被改变的所有属性，可使用paramsHandler选项
 * watchProperty(obj, ['name', 'age'], (props, obj) => {
 *    console.log(`属性 ${props.join(',')} 已变更`);
 * },{
 *   paramsHandler: (newParams, oldParams) => {
 *     return Array.from(new Set([...oldParams,...newParams]))
 *   }
 * })
 * ```
 *
 * @see {@linkcode SubManager.subscribeProperties}
 */
export function watchProperty<
  T extends AnyObject,
  P extends Array<CanWatchProperty<T>> | Set<CanWatchProperty<T>> | CanWatchProperty<T>,
  C extends AnyCallback = WatchPropertyCallback<T, P>
>(
  signal: T,
  properties: P,
  callback: C,
  options: SubscriberOptions<C> & { immediate?: boolean } = {}
): Subscriber<C> {
  const { immediate = false, ...subscriptionOptions } = options
  let props = properties as Array<keyof T>
  if (typeof properties === 'string') {
    props = [properties as keyof T]
  }
  const subscriber = SubManager.subscribeProperties(signal, props, callback, subscriptionOptions)
  if (immediate) {
    ;(subscriber.trigger as AnyCallback)(Array.from(props), signal)
  }
  return subscriber
}
