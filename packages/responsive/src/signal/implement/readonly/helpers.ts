import { ReadonlyHandler } from './readonly'
import { ReadonlyOptions } from './types'

/** 只读对象标识 */
export const READONLY_OBJECT_SYMBOL = Symbol('READONLY_OBJECT_SYMBOL')

/**
 * ## 深度只读对象
 *
 * 创建一个深度只读的代理对象，使对象的所有属性和嵌套属性都变为只读。
 * 主要用于以下场景：
 * 1. 需要向外部提供数据访问但防止修改
 * 2. 在组件间传递不可变的状态
 * 3. 作为配置对象使用时确保不被意外修改
 *
 * @template T - 目标对象类型
 * @template Deep - 是否深度只读，此函数固定为true
 * @param {T} target - 要代理的目标对象
 * @param {ReadonlyOptions<Deep> | Deep} [options={deep=true,write:'error'}] - 可选的配置选项，包括是否深度只读和写入行为处理模式，可以传入布尔值快捷设置deep配置
 * @returns {DeepReadonly<T>} 深度只读的代理对象
 * @example
 * ```typescript
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const readonlyState = readonly(state)
 *
 * // 以下操作都会失败
 * readonlyState.user.name = 'Bob' // 错误：不能修改只读属性
 * readonlyState.user.settings.theme = 'light' // 错误：嵌套属性也是只读的
 * ```
 */
export function readonly<T extends AnyObject, Deep extends boolean = true>(
  target: T,
  options?: ReadonlyOptions<Deep> | Deep
): Deep extends true ? DeepReadonly<T> : Readonly<T> {
  if (typeof options === 'boolean') {
    return ReadonlyHandler.create(target, { deep: options })
  }
  return ReadonlyHandler.create(target, options)
}

/**
 * ## 浅层只读对象
 *
 * 创建一个浅层只读的代理对象，只有对象的直接属性是只读的，嵌套对象仍然可以修改。
 * 适用场景：
 * 1. 只需保护对象的直接属性不被修改
 * 2. 允许修改嵌套对象的属性
 * 3. 性能敏感场景，避免深度代理带来的性能开销
 *
 * @template T - 目标对象类型
 * @param {T} target - 要代理的目标对象
 * @param {Omit<ReadonlyOptions, 'deep'>} [options={write:'error'}] - 可选的配置选项，包括写入行为处理模式
 * @returns {Readonly<T>} 浅层只读的代理对象
 * @example
 * ```typescript
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const shallowReadonlyState = shallowReadonly(state)
 *
 * // 直接属性不能修改，但嵌套对象可以修改
 * shallowReadonlyState.user = { name: 'Bob' } // 错误：不能修改只读属性
 * shallowReadonlyState.user.name = 'Bob' // 成功：嵌套对象可以修改
 * ```
 */
export function shallowReadonly<T extends AnyObject>(
  target: T,
  options?: Omit<ReadonlyOptions, 'deep'>
): Readonly<T> {
  return ReadonlyHandler.create(target, { ...options, deep: false })
}

/**
 * ## 判断是否为只读对象
 *
 * 检查一个值是否是通过 `readonly()` 或 `shallowReadonly()` 创建的只读代理对象。
 * 注意：此函数仅检查对象是否为只读代理，不能用于判断对象是否为响应式对象。
 *
 * @template T - 要检查的对象类型
 * @param {T} obj - 要检查的对象
 * @returns {boolean} 如果对象是只读代理则返回true，否则返回false
 * @example
 * ```typescript
 * const original = { count: 0 }
 * const readonlyObj = readonly(original)
 * const shallowReadonlyObj = shallowReadonly(original)
 *
 * isReadonly(readonlyObj) // true
 * isReadonly(shallowReadonlyObj) // true
 * isReadonly(original) // false
 * isReadonly(null) // false
 * ```
 */
export function isReadonly(obj: any): boolean {
  return obj?.[READONLY_OBJECT_SYMBOL] === true
}
