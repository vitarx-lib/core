import { isSet } from '@vitarx/utils'
import { Observer, Subscriber } from '../../observer/index'
import type { CanWatchProperty, WatchOptions } from './types'

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

/**
 * ## 监听属性变化（支持多个属性）
 *
 * 它和 `watch` 存在不同之处，它不会记录新值和旧值，只关注哪些属性发生了变化。
 * 可以同时监听多个属性，当任意属性发生变化时触发回调。
 *
 * @template T 目标对象类型，必须是一个对象类型
 * @template PROPS 属性列表类型，可以是单个属性、属性数组或Set集合
 * @template CB 回调函数类型，默认为WatchPropertyCallback<T>
 *
 * @param {T} signal - 目标对象，被监听的信号源
 * @param {PROPS} properties - 属性列表，指定要监听的属性
 *   - 可以是单个属性名
 *   - 可以是属性名数组
 *   - 可以是属性名Set集合
 *   - 如果的目标信号的原始值为集合类型，那么只能监听集合的size属性
 * @param {CB} callback - 回调函数，当指定的属性发生变化时被调用
 * @param {WatchOptions} [options] - 监听器配置选项
 *   - batch: 是否使用批处理模式，默认为true
 *   - clone: 是否克隆新旧值，默认为false
 *   - limit: 限制触发次数，默认为0（不限制）
 *   - scope: 是否自动添加到当前作用域，默认为true
 * @returns {Subscriber<CB>} - 返回订阅者实例，可用于管理订阅生命周期
 *
 * @example
 * // 监听单个属性
 * const obj = reactive({ name: 'John', age: 30 });
 * const sub = watchProperty(obj, 'name', (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 监听多个属性
 * const sub2 = watchProperty(obj, ['name', 'age'], (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 使用Set集合监听属性
 * const propsToWatch = new Set(['name', 'age']);
 * const sub3 = watchProperty(obj, propsToWatch, (props, obj) => {
 *   console.log(`属性 ${props.join(', ')} 已变更`);
 * });
 *
 * // 取消订阅
 * sub.dispose();
 */
export function watchProperty<
  T extends AnyObject,
  PROPS extends Array<CanWatchProperty<T>> | Set<CanWatchProperty<T>> | CanWatchProperty<T>,
  CB extends AnyCallback = WatchPropertyCallback<T>
>(signal: T, properties: PROPS, callback: CB, options?: WatchOptions): Subscriber<CB> {
  if (!isSet(properties) && !Array.isArray(properties)) {
    properties = [properties] as unknown as PROPS
  }
  return Observer.subscribeProperties(signal, properties as Array<keyof T>, callback, options)
}
