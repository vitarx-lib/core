// 提取监听源类型

type ExtractWatchSourceType<T> = T extends () => any ? ReturnType<T> : T
// 提取代理类型的索引
type ExtractProxyIndexType<T, D> = T extends Vitarx.Ref
  ? 'value'
  : T extends Vitarx.Reactive
    ? Vitarx.ExcludeProxySymbol<keyof T>
    : D
// 提取索引类型
type ExtractIndexType<T, D = never> = T extends Array<any> ? number : ExtractProxyIndexType<T, D>
// 推出数组元素类型
type InferArrayType<T, D = never> = T extends Array<infer R> ? ExtractProxyType<R, D> : D
// 提取父级类型
type ExtractOriginType<T, D = any> = T extends Vitarx.Ref
  ? T
  : T extends Vitarx.RefObjectTarget
    ? Vitarx.Ref<T>
    : InferArrayType<T, D>
// 提取代理类型，否则返回默认值
export type ExtractProxyType<T, D> = T extends Vitarx.Ref
  ? T['value']
  : T extends Vitarx.AllProxyInterface
    ? T extends Vitarx.Reactive<Vitarx.UnProxy<T>>
      ? T
      : D
    : D
// 创建一个联合类型，它包含了可能改变的值类型
export type ExtractValueType<T> = ExtractProxyType<T, InferArrayType<T, T>>
/**
 * 回调函数类型
 *
 * @template T - 监听的目标
 */
export type Callback<T> = WatchCallback<
  ExtractValueType<ExtractWatchSourceType<T>>,
  Vitarx.ExcludeProxySymbol<ExtractValueType<ExtractWatchSourceType<T>>>,
  ExtractIndexType<ExtractWatchSourceType<T>>,
  ExtractOriginType<ExtractWatchSourceType<T>>
>
// 创建一个联合类型，它包含所有键对应的类型
export type UnionOfValues<T extends Record<any, any> | any[], KS extends Array<keyof T>> =
  T extends Array<infer R>
    ? R
    : {
        [K in keyof KS]: KS[K] extends keyof T ? T[KS[K]] : never
      }[number]

// watch方法 监听源类型
export type WatchSourceType =
  | Vitarx.Ref
  | Vitarx.Reactive
  | Array<Vitarx.Ref | Vitarx.Reactive>
  | Vitarx.RefObjectTarget
  | Vitarx.ReactiveTarget
  | (() => any)
/**
 * 回调函数类型，接受四个参数：
 * - newValue - 新值
 * - oldValue - 旧值
 * - index - 变化的索引，如果监听的是数组则返回数组索引，监听的是对象返回属性名
 * - origin - 监听源，如果监听的是数组，则返回数组，监听的是对象，则返回对象，监听的是对象属性则返回属性所在的对象！如果属性所在的对象被删除了，则返回undefined
 */
export type WatchCallback<NV = any, OV = any, I = any, O = any> = (
  newValue: NV,
  oldValue: OV,
  index: I,
  origin: O
) => void
// 改变索引
export type ChangeIndex = Array<string | symbol | number>

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
