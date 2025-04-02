import type { Reactive, ReactiveOptions, ShallowReactive } from './types'
import { createReactiveProxySignal } from './reactive-proxy-handler'

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
