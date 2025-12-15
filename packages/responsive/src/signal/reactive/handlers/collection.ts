import type { AnyMap, AnySet, AnyWeakMap, AnyWeakSet } from '@vitarx/utils'
import { triggerSignal } from '../../../depend/index.js'
import { BaseProxyHandler } from './base.js'

/**
 * CollectionProxyHandler 类是一个代理处理器，用于处理集合类型对象的代理操作
 * 支持的集合类型包括：WeakMap、Map、Set 和 WeakSet
 * @extends BaseProxyHandler<T> 继承自基础代理处理器类
 * @template T 泛型参数，约束为 AnyWeakMap | AnyMap | AnySet | AnyWeakSet 类型
 */
export abstract class CollectionProxyHandler<
  T extends AnyWeakMap | AnyMap | AnySet | AnyWeakSet
> extends BaseProxyHandler<T> {
  // 控制是否在值上追踪信号，默认为 true
  protected override allowTrackSelf: boolean = true

  /**
   * 获取目标对象的属性值
   * @param target 目标对象
   * @param p 属性键，可以是字符串或Symbol
   * @param receiver 接收器，通常是代理对象本身
   * @return 返回获取的属性值
   */
  protected override doGet(target: T, p: string | symbol, receiver: any): any {
    // 执行依赖追踪，记录当前属性与响应式系统之间的依赖关系
    triggerSignal(this.proxy, 'get', { key: p })
    const value = Reflect.get(target, p, receiver)
    // 使用 Reflect.get 获取目标对象的属性值
    return typeof value === 'function' ? value.bind(target) : value
  }

  /**
   * 设置目标对象的属性值
   * @param target 目标对象
   * @param p 属性键，可以是字符串或Symbol
   * @param newValue 要设置的新值
   * @param receiver 接收器，通常是代理对象本身
   * @return {boolean} 返回一个布尔值，表示设置操作是否成功
   */
  protected override doSet(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
    const oldValue = Reflect.get(target, p, receiver)
    if (Object.is(oldValue, newValue)) return true
    const result = Reflect.set(target, p, newValue, receiver)
    if (result) this.triggerSignal('set', { key: p, oldValue, newValue })
    return result
  }
}

/**
 * 清除集合中所有元素的高阶函数
 * @param collection - CollectionProxyHandler类型的集合代理处理器，可以是Set或Map
 * @returns 返回一个无参数函数，执行时会清除集合中的所有元素
 */
export function collectionClear(collection: CollectionProxyHandler<AnySet | AnyMap>) {
  return () => {
    // 记录清除前的集合大小
    const oldSize = collection.target.size
    // 如果集合已经是空的，则直接返回undefined
    if (oldSize === 0) return void 0
    // 清除集合中的所有元素
    collection.target.clear()
    // 检查集合大小是否确实发生了变化
    if (collection.target.size !== oldSize)
      collection['triggerSignal']('clear', { key: 'size', oldValue: oldSize, newValue: 0 })
    // 返回undefined表示操作完成
    return void 0
  }
}
