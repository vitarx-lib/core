import { deepClone, isFunction, microTaskDebouncedCallback } from '@vitarx/utils'
import { Depend } from '../../depend/index'
import { type ChangeCallback, Observer, Subscriber } from '../../observer/index'
import { isRefSignal, isSignal, type SignalToRaw } from '../core/index'
import type { WatchOptions } from './types'

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
 * // 使用清理函数管理资源
 * watch(signal, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => console.log(newVal), 1000)
 *   onCleanup(() => clearTimeout(timer)) // 自动清理定时器
 * })
 */
export type WatchCallback<T> = (
  newValue: SignalToRaw<T>,
  oldValue: SignalToRaw<T>,
  onCleanup: (handler: VoidCallback) => void
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
      if (clone) oldValue = deepClone(result)
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
 * @example
 * ```ts
 * import { watchChanges,reactive,ref,microTaskDebouncedCallback } from 'vitarx'
 * const reactiveObj = reactive({a:1})
 * const refObj = ref({a:1})
 * watchChanges([reactiveObj,refObj],(props,signal)=>{
 *    // 其中任意一个对象变化都会触发此回调
 *    // signal是变化的对象，props是变化的属性名数组
 * })
 * reactiveObj.a++
 * refObj.value.a++
 * refObj.value.a++
 * // 上面这样修改数据，回调会触发两次，因为修改了不同的对象
 *
 * // 如果需要只触发一次，且不需要知道哪个对象变化了，可以使用微任务防抖函数实现
 * watchChanges([reactiveObj,refObj],microTaskDebouncedCallback(()=>{
 *    console.log('这样可以确保在同一个微任务中只执行一次回调')
 * }))
 * ```
 *
 * @param targets
 * @param {function} callback - 回调函数
 * @param {object} options - 监听器配置选项
 * @returns {object} - 监听器实例
 */
export function watchChanges<T extends AnyObject, CB extends ChangeCallback<T>>(
  targets: Array<T> | Set<T>,
  callback: CB,
  options?: WatchOptions
): Subscriber<CB> {
  return Observer.subscribes(targets, microTaskDebouncedCallback(callback), options)
}
