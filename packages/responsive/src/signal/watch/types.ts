import type { SubscriptionOptions } from '../../observer/index'
import type { RefSignal } from '../core/index'

/**
 * 提取出监听目标可被监听的属性
 *
 * @template T 目标类型
 * @example
 * WatchProperty<RefSignal> // value // ref信号只会触发value变化
 * WatchProperty<AnyCollection>> // size，集合类型只会触发size变化
 * WatchProperty<ProxySignal<[]> | RefSignal<[]>> // `${number}` | length  数组类型的会触发数组长度和数组指定下标变化
 * WatchProperty<ProxySignal> // keyof T 对象类型会触发对象属性变化
 */
export type CanWatchProperty<T> = T extends AnyCollection
  ? 'size'
  : T extends RefSignal
    ? 'value'
    : T extends any[]
      ? `${number}` | 'length'
      : keyof T

export interface WatchOptions extends SubscriptionOptions {
  /**
   * 克隆新旧值
   *
   * 此选项为解决监听目标值是对象时，由于对象是引用传递，
   * 导致不能区分出新值和旧值的变化，可以将此选项配置`true`来深度克隆对象。
   *
   * 注意：深度克隆操作存在额外的性能开销，需注意运行时的性能。
   *
   * @default false
   */
  clone?: boolean
}
