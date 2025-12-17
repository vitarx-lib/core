import { AnyRecord, DeepReadonly } from '@vitarx/utils'
import type { UnwrapNestedSignal } from '../../types/index.js'
import type { ReadonlyOptions, ReadonlyProxy } from '../../types/signal/readonly.js'
import { createReadonly } from './readonly.js'

const DEFAULT_OPTIONS = {
  deep: true,
  write: 'error',
  message: 'the object is read-only, and the ${prop} attribute cannot be modify!'
}
/**
 * 只读对象
 *
 * 创建一个只读的代理对象，使对象的属性变为只读。
 *
 * 主要用于以下场景：
 * 1. 需要向外部提供数据访问但防止修改
 * 2. 在组件间传递不可变的状态
 * 3. 作为配置对象使用时确保不被意外修改
 *
 * @template T - 目标对象类型
 * @template Deep - 是否深度只读
 * @param  target - 要代理的目标对象
 * @param [options.write] - 写入行为处理模式
 * @param [options.message] - 错误信息
 * @param  [options] - 可选的配置选项
 * @returns {DeepReadonly<T>} 深度只读的代理对象
 * @example
 * ```ts
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const readonlyState = readonly(state)
 *
 * // 以下操作都会失败
 * readonlyState.user.name = 'Bob' // 抛出异常
 * readonlyState.user.settings.theme = 'light' // 抛出异常，因为是深度只读的
 * ```
 */
export function readonly<T extends AnyRecord, Deep extends boolean = true>(
  target: T,
  options?: ReadonlyOptions<Deep> | Deep
): ReadonlyProxy<T, Deep> {
  if (typeof options === 'boolean') {
    options = { deep: options }
  }
  return createReadonly(target, options as Required<ReadonlyOptions<Deep>>) as any
}

/**
 * 浅层只读对象
 *
 * 创建一个浅层只读的代理对象，只有对象的直接属性是只读的，嵌套对象仍然可以修改。
 * 适用场景：
 * 1. 只需保护对象的直接属性不被修改
 * 2. 允许修改嵌套对象的属性
 * 3. 性能敏感场景，避免深度代理带来的性能开销
 *
 * @template T - 目标对象类型
 * @param target - 要代理的目标对象
 * @param [options] - 可选的配置选项，包括写入行为处理模式
 * @param [options.write] - 写入行为处理模式
 * @param [options.message] - 错误信息
 * @returns {Readonly<T>} 浅层只读的代理对象
 * @example
 * ```ts
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const shallowReadonlyState = shallowReadonly(state)
 *
 * // 直接属性不能修改，但嵌套对象可以修改
 * shallowReadonlyState.user = { name: 'Bob' } // 抛出异常
 * shallowReadonlyState.user.name = 'Bob' // 成功修改
 * ```
 */
export function shallowReadonly<T extends AnyRecord>(
  target: T,
  options?: Omit<ReadonlyOptions, 'deep'>
): Readonly<UnwrapNestedSignal<T>> {
  const optionsWithDeep = { ...DEFAULT_OPTIONS, deep: false, ...options }
  return createReadonly(target, optionsWithDeep as Required<ReadonlyOptions>) as any
}
