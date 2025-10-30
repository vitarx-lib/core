import type { AnyObject } from '@vitarx/utils'
import {
  DEEP_SIGNAL_SYMBOL,
  NON_SIGNAL_SYMBOL,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL
} from '../constants.js'

/**
 * 用于判断旧值和新值是否相等的函数
 */
export type CompareFunction = (oldValue: any, newValue: any) => boolean

/**
 * 信号可选配置选项
 *
 * @template Deep - 是否启用深层响应式转换
 * @property {Deep} [deep=true] - 是否对嵌套对象进行深层响应式转换
 * @property {CompareFunction} [compare] - 自定义值比较函数，用于决定是否触发更新
 * @remarks
 * 用于配置信号的行为。当 deep 为 true 时，会递归地将所有嵌套对象转换为响应式信号；
 * 为 false 时只转换顶层属性。compare 可用于自定义值的比较逻辑。
 *
 * @example
 * ```typescript
 * const user = reactive(data, {
 *   deep: true,
 *   compare: (a, b) => a === b
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
  compare?: CompareFunction
}

/**
 * 响应式信号的基础接口
 *
 * @template Raw - 信号原始值类型
 * @template Deep - 是否启用深层响应式转换
 */
export interface BaseSignal<Raw = any, Deep extends boolean = boolean> {
  readonly [SIGNAL_SYMBOL]: true
  readonly [DEEP_SIGNAL_SYMBOL]?: Deep
  readonly [SIGNAL_RAW_VALUE_SYMBOL]?: Raw
}

/**
 * 非响应式信号
 *
 * 具有 `NOT_SIGNAL_SYMBOL` 属性标记的对象不会被识别或构造为响应式信号。
 *
 * @template T - 对象的类型
 */
export type NonSignal<T extends AnyObject = AnyObject> = T & {
  readonly [NON_SIGNAL_SYMBOL]: true
}
