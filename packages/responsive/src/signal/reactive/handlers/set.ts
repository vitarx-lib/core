import type { AnySet, AnyWeakSet } from '@vitarx/utils'
import { collectionClear, CollectionProxyHandler } from './collection.js'

/**
 * 继承自CollectionProxyHandler的WeakSet代理处理器类
 * 用于处理WeakSet和Set类型的代理操作
 * @param T - 泛型参数，可以是AnySet或AnyWeakSet类型
 */
export class weakSetProxyHandler<T extends AnySet | AnyWeakSet> extends CollectionProxyHandler<T> {
  /**
   * 处理属性获取操作的重写方法
   * @param target - 目标对象
   * @param p - 属性键
   * @param receiver - 代理对象
   * @returns 返回属性值
   */
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

  /**
   * 创建用于添加元素的函数
   * @returns 返回一个添加元素的函数
   */
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

  /**
   * 创建用于删除元素的函数
   * @returns 返回一个删除元素的函数
   */
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
 * SetProxyHandler 类继承自 weakSetProxyHandler<AnySet>，用于处理 Set 对象的代理操作
 * 该类重写了 doGet 方法，以自定义对 Set 对象特定属性的处理逻辑
 */
export class SetProxyHandler extends weakSetProxyHandler<AnySet> {
  /**
   * 重写 doGet 方法，用于获取代理对象上的属性值
   * @param target - 被代理的原始 Set 对象
   * @param p - 要获取的属性键，可以是字符串或 Symbol
   * @param receiver - 代理对象或继承代理的对象
   * @returns 返回属性的值或处理函数
   */
  protected override doGet(target: AnySet, p: string | symbol, receiver: any): any {
    // 如果请求的属性是 'clear'，则返回自定义的 collectionClear 函数
    // 否则调用父类的 doGet 方法处理其他属性
    if (p === 'clear') return collectionClear(this)
    return super.doGet(target, p, receiver)
  }
}
