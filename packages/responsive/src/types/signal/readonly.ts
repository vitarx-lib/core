import type { AnyCollection, AnyFunction, AnyObject, DeepReadonly } from '@vitarx/utils'
import type { RefWrapper } from './ref.js'
import type { CallableSignal } from './signal.js'

/**
 * 获取信号值类型工具
 *
 * 如果 T 是 RefWrapper 或 CallableSignal 类型，则提取其内部值类型；
 * 否则直接返回 T 本身。
 *
 * @template T - 泛型参数，表示需要解包的类型
 *
 * @example
 * ```typescript
 * type A = UnwrapValueWrapper<RefWrapper<string>> // string
 * type B = UnwrapValueWrapper<number> // number
 * type C = UnwrapValueWrapper<CallableSignal<boolean>> // boolean
 * ```
 */
type UnwrapValueWrapper<T> = T extends RefWrapper<infer V> | CallableSignal<infer V, any> ? V : T

/**
 * 浅层解包工具
 *
 * 该类型用于解包对象属性的信号包装，只处理对象的第一层属性。
 * 如果属性值是信号类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @template T - 对象类型
 *
 * @example
 * ```typescript
 * type User = {
 *   name: CallableSignal<string>
 *   age: RefWrapper<number>
 *   info: {
 *     address: CallableSignal<string>
 *   }
 * }
 *
 * type UnwrappedUser = UnwrapValueWrappers<User>
 * // 等价于 { name: string; age: number; info: { address: CallableSignal<string> } }
 * ```
 */
type UnwrapValueWrappers<T extends AnyObject> = T extends AnyCollection | AnyFunction
  ? T
  : {
      [K in keyof T]: UnwrapValueWrapper<T[K]>
    }

/**
 * 深度解包嵌套信号值工具
 *
 * 该类型用于递归解包对象属性的信号包装，会处理对象的所有嵌套层级。
 * 如果属性值是信号类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @template T - 对象类型
 *
 * @example
 * ```typescript
 * type User = {
 *   name: RefWrapper<string>
 *   age: number
 *   info: {
 *     address: CallableSignal<string>
 *   }
 * }
 *
 * type UnwrappedUser = DeepUnwrapValueWrappers<User>
 * // 等价于 { name: string; age: number; info: { address: string } }
 * ```
 */
type DeepUnwrapValueWrappers<T extends object> = T extends AnyCollection | AnyFunction
  ? T
  : {
      [K in keyof T]: T[K] extends object
        ? T[K] extends RefWrapper<infer V> | CallableSignal<infer V, any>
          ? V
          : DeepUnwrapValueWrappers<T[K]>
        : T[K]
    }

/**
 * 只读代理类型工具
 *
 * 根据 IsDeep 参数决定使用浅层还是深层只读代理：
 * - 当 IsDeep 为 true 时，使用 DeepReadonly 进行深度只读处理
 * - 当 IsDeep 为 false 时，使用 Readonly 进行浅层只读处理
 *
 * @template T - 对象类型
 * @template IsDeep - 是否进行深度处理
 *
 * @example
 * ```typescript
 * type User = { name: RefWrapper<string>; profile: { age: RefWrapper<number> } }
 *
 * // 深层只读
 * type DeepReadOnlyUser = ReadonlyProxy<User, true>
 * // 等价于 DeepReadonly<{ name: string; profile: { age: number } }>
 *
 * // 浅层只读
 * type ShallowReadOnlyUser = ReadonlyProxy<User, false>
 * // 等价于 Readonly<{ name: string; profile: { age: RefWrapper<number> } }>
 * ```
 */
export type ReadonlyProxy<T extends object, IsDeep extends boolean> = IsDeep extends true
  ? DeepReadonly<DeepUnwrapValueWrappers<T>>
  : Readonly<UnwrapValueWrappers<T>>
