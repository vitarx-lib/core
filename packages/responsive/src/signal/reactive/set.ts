import type { AnySet, AnyWeakSet } from '@vitarx/utils'
import { collectionClear, CollectionProxy } from './collection.js'

/**
 * WeakSetProxy 是一个代理类，用于包装 WeakSet 或 Set 实例，提供额外的功能如信号触发。
 * 它继承自 CollectionProxy，主要重写了 add 和 delete 方法的实现，以便在操作时触发相应的信号。
 *
 * 核心功能：
 * - 代理 WeakSet 或 Set 的基本操作
 * - 在添加或删除元素时触发信号
 * - 保持原始集合的所有功能
 *
 * 使用示例：
 * ```typescript
 * const originalSet = new WeakSet();
 * const proxySet = new WeakSetProxy(originalSet).proxy;
 * const obj = {};
 * proxySet.add(obj); // 触发 'add' 信号
 * proxySet.delete(obj); // 触发 'delete' 信号
 * ```
 *
 * 构造函数参数：
 * - target: 要代理的 WeakSet 或 Set 实例
 *
 * 特殊限制：
 * - 由于 WeakSet 的特性，其元素必须是对象
 * - WeakSet 中的元素是弱引用，当没有其他引用时可能会被垃圾回收
 */
export class WeakSetProxy<T extends AnySet | AnyWeakSet> extends CollectionProxy<T> {
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果是add方法，返回自定义的addSet函数
    if (p === 'add') {
      return this.addSet()
    }
    // 如果是delete方法，返回自定义的deleteSet函数
    if (p === 'delete') {
      return this.deleteSet()
    }
    // 其他情况调用父类的doGet方法
    return super.doGet(target, p, receiver)
  }

  private addSet() {
    // 返回一个用于添加元素的函数
    return (value: any) => {
      // 检查集合中是否已存在该值
      const had = this.target.has(value)
      // 如果已存在，直接返回接收者
      if (had) return this.proxy
      // 向集合中添加新值
      const result = this.target.add(value)
      this.triggerSignal('add') // 触发添加信号
      // 根据添加结果返回接收者或添加结果
      return result ? this.proxy : result
    }
  }

  private deleteSet() {
    return (key: any) => {
      // 检查集合中是否包含指定键
      const had = this.target.has(key)
      // 尝试从集合中删除指定键
      const result = this.target.delete(key)
      // 如果元素存在且删除成功，则执行回调函数
      if (had && result) this.triggerSignal('delete')
      // 返回删除操作的结果
      return result
    }
  }
}

/**
 * SetProxy 是一个用于代理 Set 对象的类，继承自 WeakSetProxy。
 * 它主要用于自定义 Set 的某些行为，特别是 clear 操作。
 *
 * 核心功能：
 * - 自定义 Set 的 clear 行为
 * - 继承 WeakSetProxy 的其他所有代理功能
 *
 * 使用示例：
 * ```typescript
 * const mySet = new Set([1, 2, 3]);
 * const proxy = new SetProxy(mySet).proxy;
 * // proxy.clear() 将使用自定义的 clear 行为
 * ```
 *
 * 构造函数参数：
 * - target: T - 要代理的 Set 对象
 *
 * 特殊限制：
 * - 仅适用于 Set 对象
 * - clear 操作的行为将被自定义实现覆盖
 *
 * 副作用：
 * - 修改了原始 Set 对象的 clear 行为
 * - 其他操作通过父类 WeakSetProxy 处理
 */
export class SetProxy<T extends AnySet> extends WeakSetProxy<T> {
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 如果请求的属性是 'clear'，则返回自定义的 collectionClear 函数
    // 这样可以自定义 Set 的 clear 行为
    // 否则调用父类的 doGet 方法处理其他属性
    if (p === 'clear') return collectionClear(this)
    return super.doGet(target, p, receiver)
  }
}
