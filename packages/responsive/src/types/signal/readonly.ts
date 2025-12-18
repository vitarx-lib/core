import type { AnyCollection, AnyFunction, AnyObject, DeepReadonly } from '@vitarx/utils'
import type { RefWrapper } from './ref.js'
import type { Signal } from './signal.js'

/**
 * 获取信号值类型工具
 */
type UnwrapValueWrapper<T> = T extends Signal<infer V> | RefWrapper<infer V> ? V : T

/**
 * 浅层解包工具
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于解包对象属性的信号包装。
 * 如果属性值是 `Signal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: CallableSignal<string>
 *   age: RefSignal<number>
 *   info: {
 *     address: Signal<string>
 *   }
 * }
 *
 * type UnwrappedUser = UnwrapValueWrappers<User>
 * // 等价于 { name: string; age: number; info: { address: Signal<string> } }
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
 * @template T - 对象类型
 * @remarks
 * 该类型用于递归解包对象属性的信号包装。
 * 如果属性值是 `Signal` 类型，则提取其内部值类型；否则保持原类型不变。
 *
 * @example
 * ```typescript
 * type User = {
 *   name: Signal<string>
 *   age: number
 *   info: {
 *     address: Signal<string>
 *   }
 * }
 *
 * type UnwrappedUser = DeepUnwrapNestedSignal<User>
 * // 等价于 { name: string; age: number; info: { address: string } }
 * ```
 */
type DeepUnwrapValueWrappers<T extends object> = T extends AnyCollection | AnyFunction
  ? T
  : {
      [K in keyof T]: T[K] extends object
        ? T[K] extends Signal<infer V> | RefWrapper<infer V>
          ? V
          : DeepUnwrapValueWrappers<T[K]>
        : T[K]
    }

export type ReadonlyProxy<T extends object, IsDeep extends boolean> = IsDeep extends true
  ? DeepReadonly<DeepUnwrapValueWrappers<T>>
  : Readonly<UnwrapValueWrappers<T>>
