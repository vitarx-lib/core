import type { AnyMap, AnyWeakMap } from '@vitarx/utils'
import { logger } from '@vitarx/utils'
import { ReadonlyCollectionHandler } from './collection.js'

/**
 * WeakMap 只读代理处理器
 *
 * 为 WeakMap 和 Map 提供只读代理功能。
 * 拦截 set 和 delete 方法，阻止对集合的修改操作。
 *
 * @template T - Map 或 WeakMap 类型
 *
 * @example
 * ```ts
 * const map = new Map([['key', 'value']])
 * const handler = new WeakMapReadonlyHandler(map)
 * const proxy = new Proxy(map, handler)
 *
 * proxy.set('newKey', 'newValue') // 输出警告，返回原 Map
 * proxy.delete('key') // 输出警告，返回 false
 * proxy.get('key') // 正常返回 'value'
 * ```
 */
export class WeakMapReadonlyHandler<T extends AnyWeakMap | AnyMap> extends ReadonlyCollectionHandler<T> {
  /**
   * 处理属性读取操作
   * 拦截 set 和 delete 方法，其他方法正常返回
   * @param target - 目标 Map 对象
   * @param p - 属性键
   * @returns 返回属性值或只读包装方法
   */
  protected doGet(target: T, p: string | symbol): unknown {
    if (p === 'set') {
      return this.readonlySet()
    }
    if (p === 'delete') {
      return this.readonlyDelete()
    }
    const value = Reflect.get(target, p, target)
    return typeof value === 'function' ? value.bind(target) : value
  }

  /**
   * 创建只读的 set 方法
   * 调用时输出警告并返回原 Map 对象
   * @returns 返回一个空的 set 方法包装
   */
  private readonlySet(): (key: unknown, value: unknown) => T {
    return (_key: unknown, _value: unknown) => {
      logger.warn(`[Readonly] The Map is read-only, and the set method cannot be called!`)
      return this.target
    }
  }

  /**
   * 创建只读的 delete 方法
   * 调用时输出警告并返回 false
   * @returns 返回一个始终返回 false 的 delete 方法包装
   */
  private readonlyDelete(): (key: unknown) => boolean {
    return (_key: unknown) => {
      logger.warn(`[Readonly] The Map is read-only, and the delete method cannot be called!`)
      return false
    }
  }
}

/**
 * Map 只读代理处理器
 *
 * 继承自 WeakMapReadonlyHandler，额外拦截 clear 方法。
 * 专门用于 Map 类型的只读代理。
 *
 * @template T - Map 类型
 *
 * @example
 * ```ts
 * const map = new Map([['key', 'value']])
 * const handler = new MapReadonlyHandler(map)
 * const proxy = new Proxy(map, handler)
 *
 * proxy.clear() // 输出警告，操作被阻止
 * proxy.set('newKey', 'newValue') // 输出警告，操作被阻止
 * ```
 */
export class MapReadonlyHandler<T extends AnyMap> extends WeakMapReadonlyHandler<T> {
  /**
   * 处理属性读取操作
   * 额外拦截 clear 方法
   * @param target - 目标 Map 对象
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
      logger.warn(`[Readonly] The Map is read-only, and the clear method cannot be called!`)
    }
  }
}
