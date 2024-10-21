import type { IS_PLAIN_PROXY_SYMBOL, IS_PROXY_SYMBOL } from '../core/responsive/proxy.js'
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
export type ChangeIndex<T> = ExtractRefIndexType<
  T,
  ExtractFnIndexType<T, ExtractArrayIndexType<T, string | number | symbol>>
>
