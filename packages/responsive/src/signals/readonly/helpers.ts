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
 * // 基本用法
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } };
 * const readonlyState = readonly(state);
 * 
 * // Vue类比：类似于Vue 3中的readonly
 * // Vue 3: const readonlyState = readonly(state)
 * 
 * // 以下操作都会失败
 * readonlyState.user.name = 'Bob'; // 打印警告
 * readonlyState.user.settings.theme = 'light'; // 打印警告，因为是深度只读的
 * 
 * // 与响应式对象结合使用
 * const reactiveState = reactive({ count: 0 });
 * const readonlyReactive = readonly(reactiveState);
 * 
 * // 仍然可以读取值
 * console.log(readonlyReactive.count); // 0
 * 
 * // 但无法修改
 * readonlyReactive.count = 1; // 打印警告
 * 
 * // 在组件中的应用
 * function MyComponent(props) {
 *   const { config } = readonly(props); // 确保组件不修改props
 *   return <div>{config.title}</div>;
 * }
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
 * // 基本用法
 * const state = { user: { name: 'Alice', settings: { theme: 'dark' } } };
 * const shallowReadonlyState = shallowReadonly(state);
 * 
 * // Vue类比：类似于Vue 3中的shallowReadonly
 * // Vue 3: const shallowReadonlyState = shallowReadonly(state)
 * 
 * // 直接属性不能修改，但嵌套对象可以修改
 * shallowReadonlyState.user = { name: 'Bob' }; // 打印警告
 * shallowReadonlyState.user.name = 'Bob'; // 成功修改
 * 
 * // 与深度只读对比
 * const deepReadonly = readonly(state);
 * deepReadonly.user.name = 'Charlie'; // 打印警告，深度只读不允许修改
 * 
 * const shallowRO = shallowReadonly(state);
 * shallowRO.user.name = 'Charlie'; // 成功，浅层只读允许修改嵌套属性
 * 
 * // 性能优势示例
 * const largeConfig = {
 *   ui: { theme: 'dark', lang: 'en' },
 *   api: { baseURL: 'https://api.example.com', timeout: 5000 },
 *   features: { enabled: ['feature1', 'feature2'], disabled: [] }
 * };
 * 
 * // 使用浅层只读避免对大量嵌套数据进行深度代理
 * const config = shallowReadonly(largeConfig);
 * 
 * // 仍可修改内部配置
 * config.ui.theme = 'light'; // 允许修改
 * 
 * // 但不能替换顶层对象
 * config.ui = { theme: 'blue' }; // 打印警告
 * ```
 */
export function shallowReadonly<T extends AnyRecord>(target: T): ReadonlyObject<T, false> {
  return createReadonlyProxy(target, false) as any
}
