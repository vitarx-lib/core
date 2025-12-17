import type { ShallowRef } from '../../types/index.js'
import { Ref } from './impl.js'
import { PropertyRef } from './property.js'

/** @see {@link ref} 无参数重载 */
export function ref(): Ref
/** @see {@link ref} 泛型重载 */
export function ref<Value>(): Ref<Value | undefined>
/** @see {@link ref} 带初始值重载 */
export function ref<Value>(value: Value): Ref<Value>
/** @see {@link ref} 浅层响应式重载 */
export function ref<Value>(value: Value, deep: false): Ref<Value, false>
/**
 * 创建响应式引用，值变化时自动触发依赖更新
 *
 * @param value - 初始值
 * @param deep - 是否深度代理嵌套对象，默认 true
 * @example
 * ```js
 * const count = ref(0)
 * const user = ref({ name: 'Zhang' })
 * const shallow = ref({ a: { b: 1 } }, false) // 浅层响应式
 * ```
 */
export function ref<Value = any, Deep extends boolean = true>(
  value?: Value,
  deep?: Deep
): Ref<Value, Deep> {
  return new Ref(value, deep ?? true) as Ref<Value, Deep>
}

/** @see {@link shallowRef} 无参数重载 */
export function shallowRef(): ShallowRef
/** @see {@link shallowRef} 泛型重载 */
export function shallowRef<Value>(): ShallowRef<Value | undefined>
/** @see {@link shallowRef} 带初始值重载 */
export function shallowRef<Value>(value: Value): ShallowRef<Value>
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
export function shallowRef<Value = any>(value?: Value): ShallowRef<Value> {
  return new Ref(value, false) as Ref<Value, false>
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
 *
 * @see {@link PropertyRef}
 */
export function propertyRef<T extends object, K extends keyof T>(
  target: T, // 目标对象，需要被观察属性变化的对象
  key: K, // 目标对象的属性键，将被观察和响应变化
  defaultValue?: T[K] // 可选参数，当属性值为 undefined 时使用的默认值
): PropertyRef<T, K> {
  return new PropertyRef(target, key, defaultValue) // 创建并返回一个新的 PropertyRef 实例
}
