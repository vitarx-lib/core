import { AnyCollection, VoidCallback } from '@vitarx/utils'
import type { SubscriptionOptions } from '../../observer'
import type { RefSignal, SignalToRaw } from '../core'

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
   * 此选项为解决监听源是对象时，由于对象是引用传递，
   * 导致不能区分出新值和旧值的变化，可以将此选项配置`true`来深度克隆对象。
   *
   * 注意：深度克隆操作存在额外的性能开销，需注意运行时的性能。
   *
   * @default false
   */
  clone?: boolean
  /**
   * 立即执行一次回调
   *
   * @default false
   */
  immediate?: boolean
}

/**
 * 监听信号变化的回调函数类型
 *
 * 当被监听的信号或计算函数发生变化时，此回调函数将被触发执行。
 * 回调接收新值、旧值以及清理函数注册器，可用于管理副作用资源。
 *
 * @template T - 监听源的类型
 * @param {SignalToRaw<T>} newValue - 信号的新值，已经转换为原始类型
 * @param {SignalToRaw<T>} oldValue - 信号的旧值，已经转换为原始类型
 * @param {(handler: VoidCallback) => void} onCleanup - 注册清理函数的方法
 *   - 传入的清理函数将在下次回调触发前或监听被销毁时执行
 *   - 用于释放资源，如定时器、事件监听器等
 * @returns {void} - 回调函数不需要返回值
 *
 * @example
 * // 使用清理函数管理资源
 * watch(signal, (newVal, oldVal, onCleanup) => {
 *   const timer = setTimeout(() => console.log(newVal), 1000)
 *   onCleanup(() => clearTimeout(timer)) // 自动清理定时器
 * })
 */
export type WatchCallback<T> = (
  newValue: SignalToRaw<T>,
  oldValue: SignalToRaw<T>,
  onCleanup: (handler: VoidCallback) => void
) => void

/**
 * 监听属性变化的回调函数
 *
 * @template T 信号对象类型
 * @param {CanWatchProperty<T>[]} props 变化的属性列表，根据不同信号类型会有不同的可监听属性
 * @param {T} signal 监听的信号对象，即原始被监听的对象
 * @returns {void}
 * @example
 * // 回调函数示例
 * const callback = (changedProps, signal) => {
 *   console.log('变化的属性:', changedProps);
 *   console.log('信号源:', signal);
 * }
 */
export type WatchPropertyCallback<T> = (props: CanWatchProperty<T>[], signal: T) => void
