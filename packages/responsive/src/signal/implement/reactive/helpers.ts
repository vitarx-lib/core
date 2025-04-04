import { PROXY_SIGNAL_SYMBOL, type SignalOptions } from '../../core/index'
import { createReactiveProxySignal, REACTIVE_PROXY_SYMBOL } from './reactive-proxy-handler'
import type { Reactive, ShallowReactive, UnReactive } from './types'

/**
 * ## 创建默认的深层响应式代理对象
 *
 * @template T - 目标对象类型
 * @param {T} target - 要代理的目标对象
 * @returns {Reactive<T>} 深层响应式代理对象
 * @example
 * ```typescript
 * const obj = { foo: { bar: 1 } }
 * const proxy = reactive(obj)
 * // proxy.foo和proxy.foo.bar都是响应式的
 * ```
 */
export function reactive<T extends AnyObject>(target: T): Reactive<T>
/**
 * ## 创建响应式代理对象，自定义选项
 *
 * @template T - 目标对象类型
 * @param {T} target - 要代理的目标对象
 * @param {object} options - 代理配置选项
 * @param {boolean} options.deep - 启用深度代理
 * @param {CompareFunction} [options.compare=Object.is] - 自定义值比较函数
 * @returns {Reactive<T> | ShallowReactive<T>} 响应式代理对象
 * @example
 * ```typescript
 * const proxy = reactive(target, {
 *   deep: true,
 *   compare: (a, b) => a === b
 * })
 * ```
 */
export function reactive<T extends AnyObject>(
  target: T,
  options: SignalOptions<true> | {} | undefined
): Reactive<T>
export function reactive<T extends AnyObject>(
  target: T,
  options: SignalOptions<false>
): ShallowReactive<T>
export function reactive<T extends AnyObject>(
  target: T,
  options?: SignalOptions
): Reactive<T> | ShallowReactive<T> {
  return createReactiveProxySignal(target, options)
}

/**
 * ## 创建浅层响应式对象
 *
 * 该方法与`reactive({},{deep:false})`的效果是一致的。
 *
 * @template T - 目标对象类型
 * @param { T } target - 目标对象
 * @param { object } [options] - 代理选项
 * @param { CompareFunction } [options.compare=Object.is] - 自定义值比较函数
 * @returns {ShallowReactive<T>} 浅层响应式对象
 */
export function shallowReactive<T extends AnyObject>(
  target: T,
  options?: Omit<SignalOptions, 'deep'>
): ShallowReactive<T> {
  return createReactiveProxySignal(target, { ...options, deep: false }) as ShallowReactive<T>
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
 * @returns {UnReactive<T>} 返回对象的原始值：
 *   - 如果输入是响应式对象，返回其原始未代理的对象
 *   - 如果输入不是响应式对象，则原样返回
 * @alias toRaw - 为了兼容Vue API而提供的别名
 * @example
 * ```typescript
 * const original = { count: 0 }
 * const proxy = reactive(original)
 *
 * proxy.count // 访问会被跟踪
 * unReactive(proxy).count // 访问不会被跟踪
 * unReactive(proxy) === original // true
 * // 别名
 * toRaw(proxy) === original // true
 * ```
 */
export function unReactive<T extends object>(proxy: T | Reactive<T>): UnReactive<T> {
  return (Reflect.get(proxy, PROXY_SIGNAL_SYMBOL) ?? proxy) as UnReactive<T>
}

export { unReactive as toRaw }
