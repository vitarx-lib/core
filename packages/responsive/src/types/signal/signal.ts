import { IS_REF, IS_SIGNAL, SIGNAL_DEP_HEAD, SIGNAL_DEP_TAIL } from '../../constants/index.js'
import type { DepLink } from '../../depend/index.js'

/**
 * 信号接口约束接口
 */
export interface Signal {
  /** 是否为 signal（类型判定用） */
  readonly [IS_SIGNAL]: true
  /**
   * signal → effect 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_HEAD]?: DepLink
  /**
   * signal → effect 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   *
   * @internal
   */
  [SIGNAL_DEP_TAIL]?: DepLink
}

/**
 * 引用信号接口
 *
 * RefSignal 是一种特殊的信号类型，具有 value 属性访问器，
 * 可以通过 get value() 获取值，通过 set value() 设置值。
 *
 * @template T - 读取值的类型
 * @template S - 设置值的类型
 *
 * @example
 * ```typescript
 * const count: RefSignal<number> = ref(0)
 * console.log(count.value) // 0
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export interface RefSignal<T = any, S = T> extends Signal {
  readonly [IS_REF]: true
  get value(): T
  set value(value: S)
}

/**
 * 可调用信号接口
 *
 * CallableSignal 是一种可以通过函数调用方式来获取或设置值的信号。
 * 调用时不传参获取值，传参设置值。
 *
 * @template T - 读取值的类型
 * @template S - 设置值的类型
 *
 * @example
 * ```typescript
 * const count: CallableSignal<number> = signal(0)
 * console.log(count()) // 0 - 获取值
 * count(1) // 设置值
 * console.log(count()) // 1
 * ```
 */
export interface CallableSignal<T = any, S = T> extends Signal {
  (): T
  (value: S): void
}

/**
 * 任意信号类型
 *
 * 联合类型，包含 RefSignal 和 CallableSignal，
 * 用于表示所有可能的信号类型。
 *
 * @template T - 读取值的类型
 * @template S - 设置值的类型
 */
export type AnySignal<T = any, S = any> = RefSignal<T, S> | CallableSignal<T, S>

/**
 * 解包信号类型工具
 *
 * 如果 T 是信号类型，则返回信号包装的值类型；
 * 否则直接返回 T 本身。
 *
 * @template T - 泛型参数，表示需要解包的类型
 *
 * @example
 * ```typescript
 * type A = UnwrapSignal<RefSignal<string>> // string
 * type B = UnwrapSignal<number> // number
 * type C = UnwrapSignal<CallableSignal<boolean>> // boolean
 * ```
 */
export type UnwrapSignal<T> = T extends AnySignal<infer V> ? V : T
