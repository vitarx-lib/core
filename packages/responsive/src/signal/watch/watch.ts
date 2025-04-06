import { deepClone, isFunction, isSet } from '@vitarx/utils'
import { Depend } from '../../depend/index'
import { type ChangeCallback, Observer, Subscriber } from '../../observer/index'
import { isRefSignal, isSignal, type SignalToRaw } from '../core/index'
import type { CanWatchProperty, WatchCallback, WatchOptions, WatchPropertyCallback } from './types'

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
 * @template CB - 回调函数类型
 * @param {T} origin - 监听源对象或函数
 *   - 当传入信号对象时：直接监听该信号的变化
 *   - 当传入函数时：优先监听函数内部依赖的信号变化，若无依赖则监听函数返回值
 * @param {CB} callback - 变化时触发的回调函数
 *   - 接收新值、旧值作为参数
 *   - 通过第三个参数可注册清理函数，用于释放资源
 * @param {WatchOptions} [options] - 监听器配置选项
 * @param {number} [options.limit=0] - 限制触发次数，0表示不限制
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域（自动销毁）
 * @param {boolean} [options.batch=true] - 是否使用批处理模式（合并同一周期内的多次更新）
 * @param {boolean} [options.clone=false] - 是否深度克隆新旧值（解决引用类型比较问题）
 * @returns {Subscriber<VoidCallback>} - 返回订阅者实例，可用于手动取消监听
 * @throws {TypeError} - 当参数类型不正确或监听源无效时抛出类型错误
 *
 * @example
 * // 监听ref信号
 * const count = ref(0)
 * const unwatch = watch(count, (newVal, oldVal) => {
 *   console.log(`Count changed from ${oldVal} to ${newVal}`)
 * })
 *
 * // 监听计算函数
 * watch(() => count.value * 2, (newVal) => {
 *   console.log(`Doubled count is now: ${newVal}`)
 * })
 *
 * // 使用清理函数
 * watch(someSignal, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => {}, 1000)
 *   onCleanup(() => clearTimeout(timer)) // 在下次触发前或取消监听时调用
 * })
 */
export function watch<T extends AnyObject | AnyFunction, CB extends WatchCallback<T>>(
  origin: T,
  callback: CB,
  options?: WatchOptions
): Subscriber<VoidCallback> {
  if (!isFunction(callback)) throw new TypeError('callback is not a function')
  const { clone = false, ...subscriptionOptions } = options ?? {}
  // 监听目标
  let target = origin
  let cleanupFn: AnyFunction | undefined
  let oldValue: SignalToRaw<T> | undefined
  const onCleanup = (handler: VoidCallback) => {
    if (typeof handler !== 'function') {
      throw new TypeError('onCleanup handler it must be a function')
    }
    cleanupFn = handler
  }
  // 处理回调
  const handlerCallback = (newValue: SignalToRaw<T>) => {
    if (cleanupFn) {
      cleanupFn()
      cleanupFn = undefined
    }
    callback(newValue, oldValue!, onCleanup)
    oldValue = newValue
  }
  // 清理内存
  const clean = () => {
    if (cleanupFn) {
      cleanupFn()
      cleanupFn = undefined
    }
    oldValue = undefined
    // @ts-ignore
    target = undefined
  }
  if (isFunction(origin)) {
    const { subscriber, result } = Depend.subscribe(
      origin,
      () => handlerCallback(copyValue(origin(), undefined, clone)),
      subscriptionOptions
    )
    if (subscriber) {
      oldValue = copyValue(result, undefined, clone)
      return subscriber.onDispose(clean)
    }
    target = result
  }
  if (isSignal(target)) {
    // 处理值类型代理，让其返回value
    const prop = isRefSignal(target) ? ('value' as keyof T) : undefined
    oldValue = copyValue(target, prop, clone)
    const subscriber = new Subscriber(
      () => handlerCallback(copyValue(target, prop, clone)),
      subscriptionOptions
    )
    return Observer.subscribe(target, subscriber, subscriptionOptions).onDispose(clean)
  }
  throw new TypeError('watch: origin is not a signal or valid side effect function')
}

/**
 * ## 监听多个信号变化
 *
 * @param targets
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 * @example
 * import { watchChanges,reactive,ref,microTaskDebouncedCallback } from 'vitarx'
 * const reactiveObj = reactive({a:1})
 * const refObj = ref({a:1})
 * watchChanges([reactiveObj,refObj],(props,target)=>{
 *    // 其中任意一个对象变化都会触发此回调
 *    console.log(`被修改的属性名：${props.join('，')}，是refObj：${target === refObj}`)
 * })
 * reactiveObj.a++ // 被修改的属性名：a,是refObj：false
 * refObj.value.a++
 * refObj.value.a++ // 被修改的属性名：value,是refObj：true
 *
 * // 合并回调
 * watchChanges([reactiveObj,refObj],microTaskDebouncedCallback((props,target)=>{
 *   console.log(`被修改的属性名：${props.join('，')}，是refObj：${target === refObj}`)
 * }))
 * reactiveObj.a++
 * refObj.value.a++ // 被修改的属性名：value,是refObj：true
 */
export function watchChanges<T extends AnyObject, CB extends ChangeCallback<T>>(
  targets: Array<T> | Set<T>,
  callback: CB,
  options?: WatchOptions
): Subscriber<CB> {
  return Observer.subscribes(targets, callback, options)
}

/**
 * ## 监听属性变化（支持多个属性）
 *
 * 它和 `watch` 存在不同之处，它不会记录新值和旧值，只关注哪些属性发生了变化。
 * 可以同时监听多个属性，当任意属性发生变化时触发回调。
 *
 * @template T 目标对象类型，必须是一个对象类型
 * @template PROPS 属性列表类型，可以是单个属性、属性数组或Set集合
 * @template CB 回调函数类型，默认为WatchPropertyCallback<T>
 *
 * @param {T} signal - 目标对象，被监听的信号源
 * @param {PROPS} properties - 属性列表，指定要监听的属性
 *   - 可以是单个属性名
 *   - 可以是属性名数组
 *   - 可以是属性名Set集合
 *   - 如果的目标信号的原始值为集合类型，那么只能监听集合的size属性
 * @param {CB} callback - 回调函数，当指定的属性发生变化时被调用
 * @param {WatchOptions} [options] - 监听器配置选项
 *   - batch: 是否使用批处理模式，默认为true
 *   - clone: 是否克隆新旧值，默认为false
 *   - limit: 限制触发次数，默认为0（不限制）
 *   - scope: 是否自动添加到当前作用域，默认为true
 * @returns {Subscriber<CB>} - 返回订阅者实例，可用于管理订阅生命周期
 *
 * @example
 * // 监听单个属性
 * const obj = reactive({ name: 'John', age: 30 });
 * const sub = watchProperty(obj, 'name', (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 监听多个属性
 * const sub2 = watchProperty(obj, ['name', 'age'], (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 使用Set集合监听属性
 * const propsToWatch = new Set(['name', 'age']);
 * const sub3 = watchProperty(obj, propsToWatch, (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 取消订阅
 * sub.dispose();
 */
export function watchProperty<
  T extends AnyObject,
  PROPS extends Array<CanWatchProperty<T>> | Set<CanWatchProperty<T>> | CanWatchProperty<T>,
  CB extends AnyCallback = WatchPropertyCallback<T>
>(signal: T, properties: PROPS, callback: CB, options?: WatchOptions): Subscriber<CB> {
  if (!isSet(properties) && !Array.isArray(properties)) {
    properties = [properties] as unknown as PROPS
  }
  return Observer.subscribeProperties(signal, properties as Array<keyof T>, callback, options)
}
