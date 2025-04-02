import type { Reactive, ReactiveOptions, ShallowReactive, UnReactive } from './types'
import { createReactiveProxySignal } from './reactive-proxy-handler'
import { PROXY_SIGNAL_SYMBOL } from '../constants'

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
 * @param {EqualityFn} [options.equalityFn=Object.is] - 自定义值比较函数
 * @returns {Reactive<T> | ShallowReactive<T>} 响应式代理对象
 * @example
 * ```typescript
 * const proxy = reactive(target, {
 *   deep: true,
 *   equalityFn: (a, b) => a === b
 * })
 * ```
 */
export function reactive<T extends AnyObject>(
  target: T,
  options: ReactiveOptions<true> | {} | undefined
): Reactive<T>
export function reactive<T extends AnyObject>(
  target: T,
  options: ReactiveOptions<false>
): ShallowReactive<T>
export function reactive<T extends AnyObject>(
  target: T,
  options?: ReactiveOptions
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
 * @param { EqualityFn } [options.equalityFn=Object.is] - 自定义值比较函数
 * @returns {ShallowReactive<T>} 浅层响应式对象
 */
export function shallowReactive<T extends AnyObject>(
  target: T,
  options?: Omit<ReactiveOptions, 'deep'>
): ShallowReactive<T> {
  return createReactiveProxySignal(target, { ...options, deep: false }) as ShallowReactive<T>
}

/**
 * 判断是否为响应式对象
 *
 * @param val
 */
export function isReactive(val: unknown): boolean {
  return typeof val === 'object' && val !== null && !!Reflect.get(val, PROXY_SIGNAL_SYMBOL)
}

/**
 * ## 获取响应式对象的原始值，
 *
 * @template T - 目标对象类型
 * @param { T | Reactive<T> } proxy - 代理对象
 * @returns { UnReactive<T> } 如果传入的是 'reactive' 创建的对象，则会返回其真实的原始对象，否则原样返回。
 * @alias toRaw 兼容 `Vue` api
 */
export function unReactive<T extends object>(proxy: T | Reactive<T>): UnReactive<T> {
  return (Reflect.get(proxy, PROXY_SIGNAL_SYMBOL) ?? proxy) as UnReactive<T>
}

export { unReactive as toRaw }
