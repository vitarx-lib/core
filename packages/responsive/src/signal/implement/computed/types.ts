/**
 * 计算属性的值获取函数
 *
 * @template T - 计算结果值的类型
 * @param {T | undefined} oldValue - 上一次的计算结果，第一次计算时为undefined
 * @returns {T} - 计算结果
 */
export type ComputedGetter<T> = (oldValue: T | undefined) => T
/**
 * 计算属性的setter处理函数
 *
 * @template T - 同计算结果的类型
 */
export type ComputedSetter<T> = (newValue: T) => void

/**
 * 计算属性的选项
 *
 * @template T - 计算结果的类型
 */
export type ComputedOptions<T> = {
  /**
   * 计算属性的setter处理函数
   *
   * 计算属性一般是不允许修改的，如果你需要处理修改计算属性值，可以传入setter参数，
   *
   * setter参数是一个函数，接受一个参数，就是新的值，你可以在这里进行一些操作，比如修改依赖的值，但是不能修改计算属性的值。
   *
   * @example
   *
   * ```ts
   * const count = ref(0)
   * const double = computed(() => count.value * 2, {
   *   setter: (newValue) => {
   *     count.value = newValue / 2
   *   }
   * })
   * double.value = 10
   * console.log(double.value) // 5
   * ```
   *
   * @param newValue - 新的值
   */
  setter?: (newValue: T) => void
  /**
   * 立即计算
   *
   * 如果设置为true，则立即计算结果。
   * 默认为false，在第一次访问value时，才进行计算。
   *
   * @default false
   */
  immediate?: boolean
  /**
   * 是否允许添加到作用域
   *
   * 如果设置为false时，它不会随作用域销毁而停止观察依赖变化。
   *
   * 使用场景：需要在应用生命周期内保持活跃，但初始化时机在局部作用域中，需要局部作用域销毁时，不销毁计算属性。
   *
   * @default true
   */
  scope?: boolean
  /**
   * 是否使用批处理模式
   *
   * 启用批处理时，多个连续的变更会合并为一次计算，提高性能。
   * 禁用批处理时，每次变更都会重新运行getter计算，适用于需要实时响应的场景。
   *
   * 注意：禁用批处理可能导致性能问题。
   *
   * @default true
   */
  batch?: boolean
}
