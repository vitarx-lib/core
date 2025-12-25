import { AnyRecord } from '@vitarx/utils'
import { createReadonlyProxy, type ReadonlyObject } from './readonly.js'

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
 * @template IsDeep - 是否深度只读
 * @param  target - 要代理的目标对象
 * @param [deep=true] - 是否进行深度代理
 * @returns {ReadonlyObject<T>} 深度只读的代理对象
 * @example
 * ```ts
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const readonlyState = readonly(state)
 *
 * // 以下操作都会失败
 * readonlyState.user.name = 'Bob' // 打印警告
 * readonlyState.user.settings.theme = 'light' // 打印警告，因为是深度只读的
 * ```
 */
export function readonly<T extends AnyRecord, IsDeep extends boolean = true>(
  target: T,
  deep?: IsDeep
): ReadonlyObject<T, IsDeep> {
  return createReadonlyProxy(target, deep ?? true) as any
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
 * @returns {Readonly<T>} 浅层只读的代理对象
 * @example
 * ```ts
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } }
 * const shallowReadonlyState = shallowReadonly(state)
 *
 * // 直接属性不能修改，但嵌套对象可以修改
 * shallowReadonlyState.user = { name: 'Bob' } // 打印警告
 * shallowReadonlyState.user.name = 'Bob' // 成功修改
 * ```
 */
export function shallowReadonly<T extends AnyRecord>(target: T): ReadonlyObject<T, false> {
  return createReadonlyProxy(target, false) as any
}
