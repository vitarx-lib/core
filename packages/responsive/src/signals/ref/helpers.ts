import { PropertyRef } from './property.js'
import { ShallowRef } from './shallow.js'
import { ValueRef } from './value.js'

/**
 * 创建响应式引用（无参数重载）
 *
 * 创建一个未初始化的响应式引用，值为 undefined。
 *
 * @returns {ValueRef<undefined, true>} 返回一个未初始化的响应式引用
 *
 * @example
 * ```js
 * const count = ref() // Ref<undefined, true>
 * console.log(count.value) // undefined
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function ref(): ValueRef

/**
 * 创建响应式引用（泛型重载）
 *
 * 创建一个指定类型的响应式引用，初始值为 undefined。
 *
 * @template Value - 引用值的类型
 * @returns {ValueRef<Value | undefined, true>} 返回指定类型的响应式引用
 *
 * @example
 * ```js
 * const count = ref<number>() // ValueRef<number | undefined, true>
 * console.log(count.value) // undefined
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function ref<Value>(): ValueRef<Value | undefined>

/**
 * 创建响应式引用（带初始值重载）
 *
 * 创建一个带有初始值的响应式引用。
 *
 * @template Value - 引用值的类型
 * @param value - 初始值
 * @returns {ValueRef<Value, true>} 返回带有初始值的响应式引用
 *
 * @example
 * ```js
 * const count = ref(0) // ValueRef<number, true>
 * const user = ref({ name: 'Zhang' }) // Ref<{ name: string }, true>
 * console.log(count.value) // 0
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function ref<Value>(value: Value): ValueRef<Value>

/**
 * 创建响应式引用，值变化时自动触发依赖更新
 *
 * @param value - 初始值
 * @example
 * ```js
 * const count = ref(0)
 * const user = ref({ name: 'Zhang' })
 * const shallow = ref({ a: { b: 1 } }, false) // 浅层响应式
 * ```
 */
export function ref(value?: any): ValueRef {
  return new ValueRef(value)
}

/**
 * 创建浅层响应式引用（无参数重载）
 *
 * 创建一个未初始化的浅层响应式引用，值为 undefined。
 *
 * @returns {ShallowRef} 返回一个未初始化的浅层响应式引用
 *
 * @example
 * ```js
 * const count = shallowRef() // Ref<undefined, false>
 * console.log(count.value) // undefined
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function shallowRef(): ShallowRef

/**
 * 创建浅层响应式引用（泛型重载）
 *
 * 创建一个指定类型的浅层响应式引用，初始值为 undefined。
 *
 * @template T - 引用值的类型
 * @returns {ShallowRef<T | undefined>} 返回指定类型的浅层响应式引用
 *
 * @example
 * ```js
 * const count = shallowRef<number>() // Ref<number | undefined, false>
 * console.log(count.value) // undefined
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function shallowRef<T>(): ShallowRef<T | undefined>

/**
 * 创建浅层响应式引用（带初始值重载）
 *
 * 创建一个带有初始值的浅层响应式引用。
 *
 * @template T - 引用值的类型
 * @param value - 初始值
 * @returns {ShallowRef<T>} 返回带有初始值的浅层响应式引用
 *
 * @example
 * ```js
 * const count = shallowRef(0) // Ref<number, false>
 * const user = shallowRef({ name: 'Zhang' }) // Ref<{ name: string }, false>
 * console.log(count.value) // 0
 * count.value = 1
 * console.log(count.value) // 1
 * ```
 */
export function shallowRef<T>(value: T): ShallowRef<T>

/**
 * 创建浅层响应式引用，仅跟踪 `.value` 的变化，不代理嵌套对象
 *
 * @param value - 初始值
 * @example
 * ```js
 * const user = shallowRef({ profile: { age: 25 } })
 * user.value.profile.age = 26 // 不会触发更新
 * user.trigger() // 强制触发更新
 * ```
 */
export function shallowRef(value?: any): ShallowRef {
  return new ShallowRef(value)
}

/**
 * 创建一个属性引用对象
 *
 * @param target - 目标对象，其属性将被观察
 * @param key - 目标对象上要观察的属性键
 * @param defaultValue - 可选参数，属性的默认值
 * @returns {PropertyRef<T, K>} 返回一个新的 PropertyRef 实例
 * @template T - 目标对象的类型
 * @template K - 目标对象属性键的类型，必须是 T 的键之一
 * @example
 * ```js
 * const obj = reactive({ name: 'John' });
 * const nameRef = propertyRef(obj, 'name', 'Default');
 * console.log(nameRef.value); // 'John'
 * nameRef.value = 'Jane';
 * console.log(obj.name); // 'Jane'
 * ```
 */
export function propertyRef<T extends object, K extends keyof T>(
  target: T, // 目标对象，需要被观察属性变化的对象
  key: K, // 目标对象的属性键，将被观察和响应变化
  defaultValue?: T[K] // 可选参数，当属性值为 undefined 时使用的默认值
): PropertyRef<T, K> {
  return new PropertyRef(target, key, defaultValue) // 创建并返回一个新的 PropertyRef 实例
}
