import type { ProxySignal } from '../../core/index'
import type { UnwrapNestedRefs } from '../ref/index'

/**
 * 响应式代理对象类型
 *
 * @template T - 目标对象类型，必须是一个对象类型
 * @template Deep - 是否进行深度转换，默认为`true`，表示将所有属性转换为响应式信号。
 * @remarks
 * 创建一个深层响应式代理对象，会自动解包对象中的所有响应式信号值。
 * 对象的所有属性都将被转换为响应式的，包括嵌套对象。
 *
 * @example
 * ```typescript
 * const user = reactive({
 *   name: ref('Alice'),
 *   age: 18,
 *   profile: {
 *     avatar: ref('avatar.png')
 *   }
 * })
 *
 * // user.name 和 user.profile.avatar 都会被自动解包
 * console.log(user.name) // 'Alice'
 * ```
 */
export type Reactive<T extends AnyObject = {}, Deep extends boolean = true> = ProxySignal<
  T,
  Deep extends true ? UnwrapNestedRefs<T> : T,
  true
>

/**
 * 解除响应式对象的代理，获取原始对象
 *
 * @template T - 输入类型，可以是响应式对象或普通对象
 * @remarks
 * 如果传入的是响应式对象（Reactive 或 ShallowReactive），则返回其原始对象；
 * 如果传入的是普通对象，则原样返回。这个类型在需要访问原始数据结构时很有用。
 *
 * @example
 * ```typescript
 * const raw = { name: 'Alice' }
 * const proxy = reactive(raw)
 *
 * type Original = UnReactive<typeof proxy> // { name: string }
 * const original = unReactive(proxy) // 获取原始对象
 * ```
 */
export type Unreactive<T> = T extends Reactive<infer U> ? U : T
