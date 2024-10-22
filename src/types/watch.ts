import type { IS_PLAIN_PROXY_SYMBOL, IS_PROXY_SYMBOL } from '../core/responsive/proxy'
// 提取函数源返回值类型
type ExtractArraySourceType<T, D, P = true> = ExtractRefType<
  T,
  T extends Array<infer R> ? ExtractRefType<R, R, P> : D
>
// 提取函数源类型
type ExtractFnType<T, D, P = true> = T extends (...args: any[]) => infer R
  ? ExtractRefType<R, ExtractArraySourceType<R, R, P>, P>
  : D
// 提取代理类型
type ExtractRefType<T, D, P = true> =
  T extends Vitarx.Ref<T>
    ? P extends true
      ? T extends Vitarx.PlainProxy<any>
        ? T['value']
        : T
      : T
    : D
// 创建一个联合类型，它包含了改变的值类型
export type ChangeValue<T> = ExtractRefType<T, ExtractFnType<T, ExtractArraySourceType<T, T>>>
// 用于检查数组中的元素类型是否有一个符合 Vitarx.Ref<T> 是则用number做为索引
type HasRefElement<T, D> = T extends (infer U)[] ? (U extends Vitarx.Ref<U> ? number : D) : D
// 排除代理符号
type ExcludeSymbol<T> = Exclude<T, typeof IS_PLAIN_PROXY_SYMBOL | typeof IS_PROXY_SYMBOL>
// 提取数组中的元素索引
type ExtractArrayIndexType<T, D> =
  T extends Array<any> ? ExtractRefIndexType<T, HasRefElement<T, string | number | symbol>> : D
// 提取函数返回源索引
type ExtractFnIndexType<T, D> = T extends (...args: any[]) => infer R
  ? ExtractArrayIndexType<R, ExtractRefIndexType<R, string | number | symbol>>
  : D
// 提取代理类型的索引
type ExtractRefIndexType<T, D> = T extends Vitarx.Ref<T> ? ExcludeSymbol<keyof T> : D
export type ExtractIndex<T> = ExtractRefIndexType<
  T,
  ExtractFnIndexType<T, ExtractArrayIndexType<T, string | number | symbol>>
>

// 任意函数
export type AnyFunction = (...args: any[]) => any
// 改变的键或索引
export type ChangeIndex = Array<string | symbol | number>
/**
 * 回调函数类型
 *
 * @template T - 监听的目标
 * @template V - 回调函数类型
 * @template I - 变更的键或索引
 * @param {V} newValue - 新值
 * @param {V} oldValue - 旧值
 * @param {I} index - 变更的键或索引，当同时监听多个不同源对象时会是number类型，表示其在数组中的索引
 * @param {Vitarx.PlainProxy<any> | Vitarx.ObjectProxy<object>} source - 源对象
 */
export type WatchCallback<
  T,
  V = ChangeValue<T>,
  I extends number | string | symbol = ExtractIndex<T>
> = (
  newValue: V,
  oldValue: V,
  index: I,
  source: Vitarx.PlainProxy<any> | Vitarx.ObjectProxy<object>
) => void

/**
 * ## 监听器选项
 *
 * - limit: 限制回调函数调用次数，默认为0，不限制，当为1时，表示只调用一次，当为2时，表示调用两次，以此类推。
 * - isBatch: 是否采用批处理，默认为true，谨慎设置为false，假设监听的是一个数组，设置为false时，当执行array.slice等方法会触发多次回调。
 */
export interface WatchOptions {
  /**
   * 限制回调函数调用次数，默认为0，不限制，当为1时，表示只调用一次，当为2时，表示调用两次，以此类推。
   *
   * @default 0
   */
  limit?: number
  /**
   * 是否采用批处理，默认为true，需谨慎使用false，假设监听的是一个数组，
   * 设置为false时，当执行array.slice等方法会触发多次回调。
   *
   * @default true
   */
  isBatch?: boolean
}
