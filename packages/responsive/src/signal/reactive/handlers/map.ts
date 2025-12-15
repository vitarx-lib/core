import type { AnyMap, AnyWeakMap } from '@vitarx/utils'
import { collectionClear, CollectionProxyHandler } from './collection.js'

/**
 * WeakMapProxyHandler 类，继承自 CollectionProxyHandler，用于处理 WeakMap 或 Map 对象的代理操作
 * @template T - 继承自 AnyWeakMap 或 AnyMap 的泛型类型
 */
export class WeakMapProxyHandler<T extends AnyWeakMap | AnyMap> extends CollectionProxyHandler<T> {
  /**
   * 处理属性获取操作的重写方法
   * @param target - 目标 WeakMap 或 Map 对象
   * @param p - 要获取的属性键
   * @param receiver - 代理对象或继承的调用者
   * @returns 返回属性值或处理函数
   */
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果请求的是 'delete' 属性，则返回删除处理函数
    if (p === 'delete') return this.deleteMap()
    // 如果请求的是 'set' 属性，则返回设置处理函数
    if (p === 'set') return this.setMap()
    // 其他属性调用父类的 doGet 方法处理
    return super.doGet(target, p, receiver)
  }

  /**
   * 创建一个删除元素的处理函数
   * @returns 返回一个接受键并执行删除操作的函数
   */
  private deleteMap() {
    return (key: any) => {
      // 检查目标映射中是否包含指定的键
      const had = this.target.has(key)
      // 尝试删除指定键的元素
      const result = this.target.delete(key)
      // 如果之前存在删除成功，则触发回调
      if (had && result) this.triggerSignal('delete', { key })
      // 返回删除操作的结果
      return result
    }
  }

  /**
   * 创建一个设置键值对的处理函数
   * @returns 返回一个接受键和值并执行设置操作的函数
   */
  private setMap() {
    return (key: any, value: any) => {
      // 返回一个设置键值对的函数
      const had = this.target.has(key) // 检查是否已存在该键
      if (had) {
        // 如果键已存在
        const oldValue = this.target.get(key) // 获取旧值
        if (Object.is(oldValue, value)) return this.proxy // 如果值没有变化，直接返回接收者
      }
      this.target.set(key, value) // 设置新的键值对
      this.triggerSignal('set', { key }) // 触发设置信号
      return this.proxy // 返回代理对象
    }
  }
}

/**
 * MapProxyHandler 类，继承自 WeakMapProxyHandler 类
 * 用于处理 Map 对象的代理操作
 * @template T - 继承自 Map<any, any> 的泛型类型
 */
export class MapProxyHandler<T extends Map<any, any>> extends WeakMapProxyHandler<T> {
  /**
   * 获取属性值的重写方法
   * @param target - 目标 Map 对象
   * @param p - 要获取的属性键，可以是字符串或 Symbol
   * @param receiver - 代理对象或原始对象
   * @returns 返回属性值
   */
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果请求的属性是 'clear'，则返回自定义的 collectionClear 函数
    if (p === 'clear') return collectionClear(this)
    // 否则调用父类的 doGet 方法处理
    return super.doGet(target, p, receiver)
  }
}
