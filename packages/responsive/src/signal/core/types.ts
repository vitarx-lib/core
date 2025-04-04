import {
  DEEP_SIGNAL_SYMBOL,
  GET_RAW_TARGET_SYMBOL,
  NOT_SIGNAL_SYMBOL,
  PROXY_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  SIGNAL_SYMBOL
} from './constants'

/**
 * 用于判断旧值和新值是否相等的函数
 */
export type EqualityFn = (oldValue: any, newValue: any) => boolean

/**
 * 信号可选配置选项
 *
 * @template Deep - 是否启用深层响应式转换
 * @property {Deep} [deep=true] - 是否对嵌套对象进行深层响应式转换
 * @property {EqualityFn} [equalityFn] - 自定义值比较函数，用于决定是否触发更新
 * @remarks
 * 用于配置信号的行为。当 deep 为 true 时，会递归地将所有嵌套对象转换为响应式信号；
 * 为 false 时只转换顶层属性。equalityFn 可用于自定义值的比较逻辑。
 *
 * @example
 * ```typescript
 * const user = reactive(data, {
 *   deep: true,
 *   equalityFn: (a, b) => a === b
 * })
 * ```
 */
export type SignalOptions<Deep extends boolean = boolean> = {
  /**
   * 是否使用深度信号
   *
   * @default true
   */
  deep?: Deep
  /**
   * 对比函数
   *
   * 如果不设置，则使用默认的 `Object.is`
   *
   * @default Object.is
   */
  equalityFn?: EqualityFn
}

/**
 * 响应式信号的基础接口
 */
export interface BaseSignal {
  readonly [SIGNAL_SYMBOL]: true
}

/**
 * 响应式代理信号
 */
export type ProxySignal<
  Target extends AnyObject = AnyObject,
  Proxy extends AnyObject = Target,
  Deep extends boolean = boolean
> = BaseSignal & {
  readonly [DEEP_SIGNAL_SYMBOL]: Deep
  readonly [PROXY_SIGNAL_SYMBOL]: true
  readonly [GET_RAW_TARGET_SYMBOL]: Target
} & Proxy

/**
 * 解包嵌套的响应式信号值
 *
 * @template T - 目标对象类型，必须是一个对象类型
 * @remarks
 * 该类型用于递归解包对象中所有的响应式信号值。如果属性值是 `RefSignal` 类型，
 * 则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: RefSignal<string>
 *   age: number
 * }
 *
 * type UnwrappedUser = UnwrapNestedRefs<User>
 * // 等价于 { name: string; age: number }
 * ```
 */
export type UnwrapNestedRefs<T extends AnyObject> = {
  [K in keyof T]: T[K] extends NotSignal ? T[K] : T extends RefSignal<infer U> ? U : T[K]
}

/**
 * 响应式引用信号的值类型
 */
export type RefValue<T, Deep extends boolean = true> = Deep extends false
  ? T
  : T extends AnyObject
    ? T extends NotSignal
      ? T
      : T extends BaseSignal
        ? T
        : ProxySignal<T, UnwrapNestedRefs<T>, Deep>
    : T

/**
 * 引用信号的接口
 */
export interface RefSignal<Value = any, Deep extends boolean = true> extends BaseSignal {
  readonly [DEEP_SIGNAL_SYMBOL]: Deep
  readonly [REF_SIGNAL_SYMBOL]: true

  /**
   * 获取信号的当前值
   */
  get value(): RefValue<Value, Deep>

  /**
   * 设置信号的新值
   */
  set value(newValue: Value)
}

/**
 * 非响应式信号
 *
 * 具有 `NOT_SIGNAL_SYMBOL` 属性标记的对象不会被识别或构造为响应式信号。
 */
export type NotSignal<T extends AnyObject = AnyObject> = T & {
  readonly [NOT_SIGNAL_SYMBOL]: true
}
