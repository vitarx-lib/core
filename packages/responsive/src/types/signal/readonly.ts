import type { AnyCollection, AnyFunction, AnyObject, DeepReadonly } from '@vitarx/utils'
import type { Signal, UnwrapSignal } from './signal.js'

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
export type UnwrapValueWrappers<T extends AnyObject> = T extends AnyCollection | AnyFunction
  ? T
  : {
      [K in keyof T]: UnwrapSignal<T[K]>
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
export type DeepUnwrapValueWrappers<T extends object> = T extends AnyCollection | AnyFunction
  ? T
  : {
      [K in keyof T]: T[K] extends object
        ? T[K] extends Signal<infer V>
          ? V
          : DeepUnwrapValueWrappers<T[K]>
        : T[K]
    }

export type ReadonlyProxy<T extends object, Deep extends boolean> = Deep extends true
  ? DeepReadonly<DeepUnwrapValueWrappers<T>>
  : Readonly<UnwrapValueWrappers<T>>

/**
 * 只读选项接口
 */
export interface ReadonlyOptions<Deep extends boolean = boolean> {
  /**
   * 是否深度只读
   * @default true
   */
  deep?: Deep
  /**
   * 写入行为处理模式
   * - error: 抛出错误
   * - warning: 仅警告
   * - warningAndWrite: 警告并允许写入
   *
   * @default "error"
   */
  write?: 'error' | 'warning' | 'warningAndWrite'
  /**
   * 要输出的信息
   *
   * 支持 ${prop} 占位符
   *
   * @default "The object is read-only, and the ${prop} attribute cannot be removed!"
   */
  message?: string
}
