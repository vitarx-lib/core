import type { AnyMap, AnyWeakMap } from '@vitarx/utils'
import { collectionClear, ReactiveCollection } from './collection.js'

/**
 * WeakMapReactive 是一个代理类，用于封装 WeakMap 或 Map 对象，提供响应式的数据操作能力。
 * 该类继承自 ReactiveCollection，并重写了属性获取操作，以支持对 Map/WeakMap 的 set 和 delete 操作的拦截和处理。
 *
 * 核心功能：
 * - 拦截并处理 Map/WeakMap 的 set 和 delete 操作
 * - 在数据变更时触发相应的信号
 *
 * 使用示例：
 * ```typescript
 * const originalMap = new Map();
 * const proxyMap = new WeakMapReactive(originalMap).proxy;
 *
 * // 使用代理对象设置值
 * proxyMap.set('key', 'value');
 *
 * // 使用代理对象删除值
 * proxyMap.delete('key');
 * ```
 *
 * 构造函数参数：
 * @param target - 被代理的目标 WeakMap 或 Map 对象
 *
 * 注意事项：
 * - 该类主要设计用于响应式系统，会在数据变更时触发信号
 * - 不建议直接操作原始的 Map/WeakMap 对象，应通过代理对象进行操作
 * - 当使用 WeakMap 时，需要注意弱引用的特性
 */
export class WeakMapReactive<T extends AnyWeakMap | AnyMap> extends ReactiveCollection<T> {
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果请求的是 'delete' 属性，则返回删除处理函数
    if (p === 'delete') return this.deleteMap()
    // 如果请求的是 'set' 属性，则返回设置处理函数
    if (p === 'set') return this.setMap()
    // 其他属性调用父类的 doGet 方法处理
    return super.doGet(target, p, receiver)
  }

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
 * MapReactive 是一个扩展自 WeakMapReactive 的代理类，专门用于处理 Map 对象的代理操作。
 * 它重写了属性获取方法，以提供对 Map 对象的特殊处理，特别是对 'clear' 方法的自定义实现。
 *
 * 核心功能：
 * - 代理 Map 对象的基本操作
 * - 自定义处理 'clear' 方法
 * - 继承 WeakMapReactive 的其他功能
 *
 * 使用示例：
 * ```typescript
 * const originalMap = new Map();
 * const proxy = new ReactiveMap(originalMap).proxy;
 * ```
 *
 * 构造函数参数：
 * - 继承自 WeakMapReactive，无额外参数
 *
 * 特殊限制：
 * - 主要用于 Map 对象的代理
 * - 对 'clear' 方法有特殊处理逻辑
 */
export class MapReactive<T extends AnyMap> extends WeakMapReactive<T> {
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果请求的属性是 'clear'，则返回自定义的 collectionClear 函数
    if (p === 'clear') return collectionClear(this)
    // 否则调用父类的 doGet 方法处理
    return super.doGet(target, p, receiver)
  }
}
