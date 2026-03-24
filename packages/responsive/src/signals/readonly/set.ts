import type { AnySet, AnyWeakSet } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import { ReadonlyCollectionHandler } from './collection.js'

/**
 * WeakSet 只读代理处理器
 *
 * 为 WeakSet 和 Set 提供只读代理功能。
 * 拦截 add 和 delete 方法，阻止对集合的修改操作。
 *
 * @template T - Set 或 WeakSet 类型
 *
 * @example
 * ```ts
 * const set = new Set([1, 2, 3])
 * const handler = new WeakSetReadonlyHandler(set)
 * const proxy = new Proxy(set, handler)
 *
 * proxy.add(4) // 输出警告，返回代理对象
 * proxy.delete(1) // 输出警告，返回 false
 * proxy.has(1) // 正常返回 true
 * ```
 */
export class WeakSetReadonlyHandler<
  T extends AnySet | AnyWeakSet
> extends ReadonlyCollectionHandler<T> {
  /**
   * 处理属性读取操作
   * 拦截 add 和 delete 方法，其他方法正常返回
   * @param target - 目标 Set 对象
   * @param p - 属性键
   * @returns 返回属性值或只读包装方法
   */
  protected doGet(target: T, p: string | symbol): unknown {
    if (p === 'add') {
      return this.readonlyAdd()
    }
    if (p === 'delete') {
      return this.readonlyDelete()
    }
    const value = Reflect.get(target, p, target)
    return typeof value === 'function' ? value.bind(target) : value
  }

  /**
   * 创建只读的 add 方法
   * 调用时输出警告并返回代理对象
   * @returns 返回一个空的 add 方法包装
   */
  private readonlyAdd(): (value: unknown) => T {
    return (_value: unknown) => {
      logger.warn(`[Readonly] The Set is read-only, and the add method cannot be called!`)
      return this.proxy
    }
  }

  /**
   * 创建只读的 delete 方法
   * 调用时输出警告并返回 false
   * @returns 返回一个始终返回 false 的 delete 方法包装
   */
  private readonlyDelete(): (key: unknown) => boolean {
    return (_key: unknown) => {
      logger.warn(`[Readonly] The Set is read-only, and the delete method cannot be called!`)
      return false
    }
  }
}

/**
 * Set 只读代理处理器
 *
 * 继承自 WeakSetReadonlyHandler，额外拦截 clear 方法。
 * 专门用于 Set 类型的只读代理。
 *
 * @template T - Set 类型
 *
 * @example
 * ```ts
 * const set = new Set([1, 2, 3])
 * const handler = new SetReadonlyHandler(set)
 * const proxy = new Proxy(set, handler)
 *
 * proxy.clear() // 输出警告，操作被阻止
 * proxy.add(4) // 输出警告，操作被阻止
 * ```
 */
export class SetReadonlyHandler<T extends AnySet> extends WeakSetReadonlyHandler<T> {
  /**
   * 处理属性读取操作
   * 额外拦截 clear 方法
   * @param target - 目标 Set 对象
   * @param p - 属性键
   * @returns 返回属性值或只读包装方法
   */
  protected override doGet(target: T, p: string | symbol): unknown {
    if (p === 'clear') {
      return this.readonlyClear()
    }
    return super.doGet(target, p)
  }

  /**
   * 创建只读的 clear 方法
   * 调用时输出警告
   * @returns 返回一个空的 clear 方法包装
   */
  private readonlyClear(): () => void {
    return () => {
      logger.warn(`[Readonly] The Set is read-only, and the clear method cannot be called!`)
    }
  }
}
