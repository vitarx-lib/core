import type { AnyMap, AnySet, AnyWeakMap, AnyWeakSet } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import { IS_RAW, IS_READONLY, RAW_VALUE } from '../shared/index.js'

/**
 * 集合类型只读代理处理器抽象基类
 *
 * 为 Map、Set、WeakMap、WeakSet 等集合类型提供只读代理功能。
 * 拦截所有修改操作并输出警告日志，防止对集合的意外修改。
 *
 * @template T - 集合类型，支持 Map、Set、WeakMap、WeakSet
 *
 * @example
 * ```ts
 * const map = new Map([['key', 'value']])
 * const handler = new MapReadonlyHandler(map)
 * const proxy = new Proxy(map, handler)
 *
 * proxy.set('newKey', 'newValue') // 输出警告，操作被阻止
 * proxy.get('key') // 正常返回 'value'
 * ```
 */
export abstract class ReadonlyCollectionHandler<
  T extends AnyWeakMap | AnyMap | AnySet | AnyWeakSet
> implements ProxyHandler<T> {
  /**
   * 代理对象引用，用于在只读方法中返回代理对象
   */
  protected proxy!: T

  constructor(public readonly target: T) {}

  /**
   * 拦截属性读取操作
   * 处理内部标识符（IS_RAW、IS_READONLY、RAW_VALUE）并委托给子类实现
   * @param target - 目标集合对象
   * @param p - 属性键
   * @param receiver - 代理对象
   * @returns 返回属性值或标识符对应的值
   */
  get(target: T, p: string | symbol, receiver: T): unknown {
    if (p === IS_RAW) return true
    if (p === IS_READONLY) return true
    if (p === RAW_VALUE) return target
    this.proxy = receiver
    return this.doGet(target, p)
  }

  /**
   * 子类实现的属性读取方法
   * 用于处理特定集合类型的属性访问逻辑
   * @param target - 目标集合对象
   * @param p - 属性键
   * @returns 返回属性值
   */
  protected abstract doGet(target: T, p: string | symbol): unknown

  /**
   * 拦截属性设置操作
   * 阻止所有设置操作并输出警告
   * @param _target - 目标集合对象
   * @param p - 属性键
   * @param _value - 要设置的值
   * @returns 始终返回 true 以避免 TypeError
   */
  set(_target: T, p: string | symbol, _value: unknown): boolean {
    logger.warn(
      `[Readonly] The collection is read-only, and the ${String(p)} attribute cannot be set!`
    )
    return true
  }

  /**
   * 拦截属性删除操作
   * 阻止所有删除操作并输出警告
   * @param _target - 目标集合对象
   * @param p - 属性键
   * @returns 始终返回 true 以避免 TypeError
   */
  deleteProperty(_target: T, p: string | symbol): boolean {
    logger.warn(
      `[Readonly] The collection is read-only, and the ${String(p)} attribute cannot be removed!`
    )
    return true
  }
}
