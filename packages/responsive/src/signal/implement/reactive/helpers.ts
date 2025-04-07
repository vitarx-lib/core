import { SIGNAL_RAW_VALUE_SYMBOL, type SignalOptions } from '../../core/index'
import { createReactiveProxySignal, REACTIVE_PROXY_SYMBOL } from './proxy-handler'
import type { Reactive, Unreactive } from './types'

/**
 * ## 创建响应式代理对象
 *
 * @template T - 目标对象类型
 * @template Deep - 是否深度代理
 * @param {T} target - 要代理的目标对象
 * @param {object | boolean} options - 代理配置选项，支持直接传入boolean指定deep配置
 * @param {boolean} [options.deep=true] - 启用深度代理
 * @param {CompareFunction} [options.compare=Object.is] - 自定义值比较函数
 * @returns {Reactive<T,Deep>} 响应式代理对象
 * @example
 * // 深层代理
 * const deepProxy = reactive({a:{b:1}}, {
 *   deep: true, // 可以不传，默认值是 true
 *   compare: (a, b) => a === b // 自定义比较函数
 * })
 * deepProxy.a.b++ // 会触发订阅deepProxy的回调函数
 * // 浅层代理
 * const shallowProxy = reactive({a:{b:1}}, false) // 第二个参数支持boolean值指定deep选项
 * shallowProxy.a.b++ // 不会触发订阅shallowProxy的回调函数
 * notifySubscribers(shallowProxy,'a') // 手动通知触发订阅者
 */
export function reactive<T extends AnyObject, Deep extends boolean = true>(
  target: T,
  options?: SignalOptions<Deep> | Deep
): Reactive<T, Deep> {
  if (typeof options === 'boolean') {
    return createReactiveProxySignal(target, { deep: options })
  }
  return createReactiveProxySignal(target, options)
}

/**
 * ## 创建浅层响应式对象
 *
 * 与`reactive({},{deep:false})`的效果是一致的。
 *
 * @template T - 目标对象类型
 * @param { T } target - 目标对象
 * @param { object } [options] - 代理选项
 * @param { CompareFunction } [options.compare=Object.is] - 自定义值比较函数
 * @returns {Reactive<T,false>} 浅层响应式对象
 */
export function shallowReactive<T extends AnyObject>(
  target: T,
  options?: Omit<SignalOptions, 'deep'>
): Reactive<T, false> {
  return createReactiveProxySignal(target, { ...options, deep: false })
}

/**
 * ## 判断一个值是否为响应式对象
 *
 * 该函数用于检查一个值是否是通过 `reactive()` 或 `shallowReactive()` 创建的响应式对象。
 * 响应式对象是指被代理并能够在值发生变化时自动触发更新的对象。
 *
 * @param {unknown} val - 要检查的值，可以是任意类型
 * @returns {boolean} 如果值是响应式对象则返回 `true`，否则返回 `false`
 * @example
 * ```typescript
 * const obj = { foo: 1 }
 * const reactiveObj = reactive(obj)
 *
 * isReactive(reactiveObj) // true
 * isReactive(obj) // false
 * isReactive(null) // false
 * ```
 */
export function isReactive(val: unknown): boolean {
  return typeof val === 'object' && val !== null && !!Reflect.get(val, REACTIVE_PROXY_SYMBOL)
}

/**
 * ## 获取响应式对象的原始值
 *
 * 该函数用于获取一个响应式对象的原始未代理状态。这在以下场景特别有用：
 * - 需要绕过响应式系统直接操作原始数据时
 * - 需要将响应式对象传递给不支持Proxy的外部库时
 * - 需要比较两个响应式对象的原始值时
 *
 * @template T - 目标对象类型
 * @param {T | Reactive<T>} proxy - 要获取原始值的对象。可以是：
 *   - 响应式对象：将返回其原始未代理的值
 *   - 非响应式对象：将原样返回
 * @returns {Unreactive<T>} 返回对象的原始值：
 *   - 如果输入是响应式对象，返回其原始未代理的对象
 *   - 如果输入不是响应式对象，则原样返回
 * @example
 * ```typescript
 * const original = { count: 0 }
 * const proxy = reactive(original)
 *
 * proxy.count // 访问会被跟踪
 * unreactive(proxy).count // 访问不会被跟踪
 * unreactive(proxy) === original // true
 * ```
 */
export function unreactive<T extends object>(proxy: T | Reactive<T>): Unreactive<T> {
  return (Reflect.get(proxy, SIGNAL_RAW_VALUE_SYMBOL) ?? proxy) as Unreactive<T>
}
