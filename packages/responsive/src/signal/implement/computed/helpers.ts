import { Computed } from './computed'
import type { ComputedGetter, ComputedOptions, ComputedSetter } from './types'

/**
 * 创建一个计算属性
 *
 * 计算属性是一种特殊的响应式数据，它的值由一个getter函数计算得出。
 * 当依赖的响应式数据发生变化时，计算属性会自动重新计算并更新其值。
 *
 * @template T - 计算结果的类型
 * @param {ComputedGetter<T>} getter - 计算属性的getter函数，接收上一次的计算结果作为参数
 * @param {ComputedOptions<T>} [options={}] - 计算属性的配置选项
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
 *   () => count.value * 2,
 *   {
 *     setter: (newValue) => {
 *       count.value = newValue / 2
 *     }
 *   }
 * )
 * double.value = 10
 * console.log(count.value) // 5
 * ```
 */
export function computed<T>(getter: ComputedGetter<T>, options?: ComputedOptions<T>): Computed<T> {
  return new Computed(getter, options)
}

/**
 * 创建一个带有setter的计算属性
 *
 * 这是一个便捷函数，用于创建同时具有getter和setter的计算属性。
 *
 * @template T - 计算结果的类型
 * @param {ComputedGetter<T>} getter - 计算属性的getter函数
 * @param {ComputedSetter<T>} setter - 计算属性的setter函数
 * @param {Omit<ComputedOptions<T>, 'setter'>} [options={}] - 其他计算属性配置选项
 * @returns {Computed<T>} 创建的计算属性对象
 * @example
 * ```ts
 * const count = ref(0)
 * const double = computedWithSetter(
 *   () => count.value * 2,
 *   (newValue) => {
 *     count.value = newValue / 2
 *   }
 * )
 * double.value = 10
 * console.log(count.value) // 5
 * ```
 */
export function computedWithSetter<T>(
  getter: ComputedGetter<T>,
  setter: ComputedSetter<T>,
  options: Omit<ComputedOptions<T>, 'setter'> = {}
): Computed<T> {
  return computed(getter, { ...options, setter })
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
 * ```
 */
export function isComputed(val: unknown): val is Computed<any> {
  return val instanceof Computed
}

/**
 * 解除`Computed`计算属性的监听并获取其值
 *
 * 此函数会停止计算属性对其依赖的监听，使其不再响应依赖变化。
 * 如果传入的是计算属性实例，则调用其`stop`方法并返回最后一次的计算结果；
 * 如果传入的不是计算属性实例，则原样返回。
 *
 * @template T - 值或计算属性的类型
 * @param {T | Computed<T>} computed - 计算属性实例或任意值
 * @returns {T} 如果是计算属性则返回其最终值，否则返回原值
 * @example
 * ```ts
 * const count = ref(0)
 * const double = computed(() => count.value * 2)
 *
 * console.log(double.value) // 0
 * count.value = 2
 * console.log(double.value) // 4
 *
 * // 停止监听并获取最终值
 * const finalValue = stopCompute(double) // 4
 *
 * // 依赖变化不再触发更新
 * count.value = 10
 * console.log(double.value) // 仍然是4
 * ```
 */
export function stopCompute<T>(computed: T | Computed<T>): T {
  return isComputed(computed) ? computed.stop() : (computed as T)
}
