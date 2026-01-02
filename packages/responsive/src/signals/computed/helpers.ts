import type { DebuggerOptions } from '../../core/index.js'
import { Computed, type ComputedGetter, type ComputedSetter } from './computed.js'

/**
 * 创建一个计算属性
 *
 * 计算属性是一种特殊的响应式数据，它的值由一个getter函数计算得出。
 * 当依赖的响应式数据发生变化时，计算属性会自动重新计算并更新其值。
 *
 * @template T - 计算结果的类型
 * @param {ComputedGetter<T>} getter - 计算属性的getter函数，接收上一次的计算结果作为参数
 * @param [debuggerOptions] - 调试选项
 * @param {DebuggerOptions} [debuggerOptions.onTrack] - 调试选项，用于设置track回调函数
 * @param {DebuggerOptions} [debuggerOptions.onTrigger] - 调试选项，用于设置trigger回调函数
 * @returns {Computed<T>} 创建的计算属性对象
 * @example
 * ```ts
 * // 基本用法
 * const count = ref(0)
 * const double = computed(() => count.value * 2)
 * console.log(double.value) // 0
 * count.value = 2
 * console.log(double.value) // 4
 *
 * // 使用setter
 * const count = ref(0)
 * const double = computed(
 *   {
 *     get: () => count.value * 2,
 *     set: (newValue) => {
 *       count.value = newValue / 2
 *     }
 *   }
 * )
 * double.value = 10
 * console.log(count.value) // 5
 * ```
 */
export function computed<T>(
  getter: ComputedGetter<T> | { get: ComputedGetter<T>; set: ComputedSetter<T> },
  debuggerOptions?: DebuggerOptions
): Computed<T> {
  return new Computed(getter, debuggerOptions)
}

/**
 * 判断是否为计算属性对象
 *
 * 此函数用于检查一个值是否是通过`computed`或`computedWithSetter`创建的计算属性实例。
 * 计算属性是一种特殊的响应式数据，其值由getter函数计算得出，并在依赖变化时自动更新。
 *
 * @template T - 任意类型
 * @param {unknown} val - 要检查的值
 * @returns {boolean} 如果值是计算属性实例则返回`true`，否则返回`false`
 * @example
 * ```ts
 * const count = ref(0)
 * const double = computed(() => count.value * 2)
 *
 * isComputed(double) // true
 * isComputed(count) // false
 * isComputed(123) // false
 *
 * // 等同于 val instanceof Computed
 * ```
 */
export function isComputed(val: unknown): val is Computed<any> {
  return val instanceof Computed
}
