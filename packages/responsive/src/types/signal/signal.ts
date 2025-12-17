import type { AnyCollection, AnyObject } from '@vitarx/utils'
import {
  type IS_SIGNAL,
  SIGNAL_DEP_HEAD,
  SIGNAL_DEP_TAIL,
  type SIGNAL_VALUE
} from '../../constants/index.js'
import type { DepLink } from '../../depend/index.js'
import type { NonReactive } from './reactive.js'

/**
 * 响应式信号接口
 *
 * @template T - 信号包装值类型
 * @interface
 */
export interface Signal<T = any> {
  /** 是否为 signal（类型判定用） */
  readonly [IS_SIGNAL]: true
  /** 读取值（必须提供，readSignal / getSignal 使用） */
  readonly [SIGNAL_VALUE]: T
  /**
   * signal → effect 链表头
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [SIGNAL_DEP_HEAD]?: DepLink
  /**
   * signal → effect 链表尾
   *
   * ⚠️ 注意：依赖系统核心数据，请勿修改。
   */
  [SIGNAL_DEP_TAIL]?: DepLink
}
/**
 * 获取信号值类型辅助工具
 */
export type UnwrapSignal<T> = T extends Signal<infer V> ? V : T

/**
 * 解包嵌套的信号值
 *
 * @template T - 对象类型
 * @remarks
 * 该类型用于解包对象属性的信号包装。
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
 * type UnwrappedUser = UnwrapNestedSignal<User>
 * // 等价于 { name: string; age: number; info: { address: Signal<string> } }
 * ```
 */
export type UnwrapNestedSignal<T extends AnyObject> = T extends AnyCollection
  ? T
  : {
      [K in keyof T]: T[K] extends Signal<infer U> ? U : T[K]
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
export type DeepUnwrapNestedSignal<T extends object> = T extends AnyCollection
  ? T
  : T extends NonReactive
    ? T
    : {
        [K in keyof T]: T[K] extends object
          ? T[K] extends Signal<infer U>
            ? U
            : DeepUnwrapNestedSignal<T[K]>
          : T[K]
      }
