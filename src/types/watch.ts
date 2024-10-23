// 提取监听源类型
export type ExtractWatchSourceType<T> = T extends AnyFunction ? ReturnType<T> : T
// 推出数组元素类型
export type InferArrayType<T, D = never> = T extends Array<infer R> ? R : D
// 推出代理类型，否则返回默认值
export type ExtractRefType<T, D> =
  T extends Vitarx.PlainProxy<any> ? T['value'] : T extends Vitarx.Ref<T> ? T : D
// 创建一个联合类型，它包含了可能改变的值类型
export type ExtractValueType<T> = ExtractRefType<T, InferArrayType<T, T>>
// 提取代理类型的索引
export type ExtractRefIndexType<T, D> = T extends Vitarx.Ref<T> ? keyof Vitarx.UnRef<T> : D
// 提取索引类型
export type ExtractIndexType<T, D = string | number | symbol> =
  T extends Array<any> ? number : ExtractRefIndexType<T, D>
// 提取父节点类型
export type ExtractOriginType<
  T,
  D =
    | Vitarx.Ref<{
        [k: string | number | symbol]: any
      }>
    | undefined
> = T extends Vitarx.PlainProxy<any> ? T : T extends Vitarx.Ref<T> ? T : InferArrayType<T, D>
/**
 * 回调函数类型
 *
 * @template T - 监听的目标
 */
export type Callback<T> = WatchCallback<
  ExtractValueType<ExtractWatchSourceType<T>>,
  Vitarx.UnRef<ExtractValueType<ExtractWatchSourceType<T>>>,
  ExtractIndexType<ExtractWatchSourceType<T>>,
  ExtractOriginType<ExtractWatchSourceType<T>>
>
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
// 任意函数
export type AnyFunction = (...args: any[]) => any
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
