import type { AnyMap, AnySet, AnyWeakMap, AnyWeakSet } from '@vitarx/utils'
import {
  DEP_LINK_HEAD,
  DEP_LINK_TAIL,
  DepLink,
  trackSignal,
  triggerSignal
} from '../../depend/index.js'
import type { DebuggerEventOptions, SignalOpType } from '../../types/index.js'
import type { CollectionSignal } from '../../types/signal/collection.js'
import { IS_SIGNAL, SIGNAL_VALUE } from '../core/index.js'

/*******************    💫 Codegeex Suggestion    *******************/
/**
 * CollectionProxy 是一个抽象代理类，用于创建响应式的集合类型（Map、WeakMap、Set、WeakSet）代理。
 * 该类实现了基本的代理行为，包括依赖追踪和信号触发机制。
 *
 * 核心功能：
 * - 创建响应式的集合代理对象
 * - 实现依赖追踪和信号触发机制
 * - 处理集合的读写操作
 * - 支持开发环境下的调试信息
 *
 * @example
 * ```typescript
 * class MyMapProxy extends CollectionProxy<Map<string, number>> {
 *   // 实现具体的代理逻辑
 * }
 * const map = new Map<string, number>();
 * const proxy = new MyMapProxy(map);
 * const reactiveMap = proxy.proxy;
 * ```
 *
 * @template T - 被代理的集合类型，可以是 Map、WeakMap、Set 或 WeakSet
 *
 * @param target - 要代理的目标集合对象
 *
 * @remarks
 * - 该类是抽象类，需要通过子类实现具体的代理逻辑
 * - 集合类型的代理对象是不可变的，不允许直接写入操作
 * - 在开发环境下会提供额外的调试信息
 */
export abstract class CollectionProxy<T extends AnyWeakMap | AnyMap | AnySet | AnyWeakSet> {
  // 依赖链头部，可选属性
  [DEP_LINK_HEAD]?: DepLink;
  // 依赖链尾部，可选属性
  [DEP_LINK_TAIL]?: DepLink
  // 只读属性，存储 Signal 类型的代理对象
  readonly proxy: CollectionSignal<T>
  /**
   * 构造函数
   * @param target - 要代理的目标对象
   */
  constructor(public target: T) {
    // 创建代理对象并赋值给 proxy 属性
    this.proxy = new Proxy(this.target, this) as CollectionSignal<T>
  }
  /**
   * ProxyHandler 的 get 方法实现
   * @param target - 目标对象
   * @param p - 属性键，可以是字符串或 symbol
   * @param receiver - 代理对象或继承代理对象
   * @returns - 属性值
   */
  get(target: T, p: string | symbol, receiver: any): any {
    // 如果属性键是 symbol 类型
    if (typeof p === 'symbol') {
      // 使用 switch 语句处理特定的 symbol 属性
      switch (p) {
        case IS_SIGNAL:
          return true
        case DEP_LINK_HEAD:
          return this[DEP_LINK_HEAD]
        case DEP_LINK_TAIL:
          return this[DEP_LINK_TAIL]
        case SIGNAL_VALUE:
          // 跟踪信号依赖
          this.trackSignal('get')
          return target
      }
    }
    // 调用子类实现的 doGet 方法处理非 symbol 属性
    return this.doGet(target, p, receiver)
  }
  /**
   * ProxyHandler 的 set 方法实现
   * @param target - 目标对象
   * @param p - 属性键，可以是字符串或 symbol
   * @param newValue - 要设置的新值
   * @param receiver - 代理对象或继承代理对象
   * @returns - 设置操作是否成功
   */
  set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
    if (p === SIGNAL_VALUE) {
      throw new Error('Collection type proxies are immutable and do not allow write operations')
    }
    // 如果是依赖链头尾属性，直接设置并返回 true
    if (p === DEP_LINK_HEAD || p === DEP_LINK_TAIL) {
      ;(this as any)[p] = newValue
      return true
    }
    // 调用子类实现的 doSet 方法处理其他属性
    return this.doSet(target, p, newValue, receiver)
  }
  /**
   * 获取目标对象的属性值
   * @param target 目标对象
   * @param p 属性键，可以是字符串或Symbol
   * @param receiver 接收器，通常是代理对象本身
   * @return 返回获取的属性值
   */
  protected doGet(target: T, p: string | symbol, receiver: any): any {
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
  protected doSet(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
    const oldValue = Reflect.get(target, p, receiver)
    if (Object.is(oldValue, newValue)) return true
    const result = Reflect.set(target, p, newValue, receiver)
    if (result) this.triggerSignal('set', { key: p, oldValue, newValue })
    return result
  }
  /**
   * 触发信号的方法
   * 根据当前环境是否为开发环境决定是否传递 devInfo 参数
   * @param type - 信号操作类型
   * @param devInfo - 调试器事件选项（可选参数，仅在开发环境使用）
   */
  protected triggerSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    // 判断是否为开发环境
    if (__DEV__) {
      // 在开发环境下，传递 devInfo 参数
      triggerSignal(this.proxy, type, devInfo)
    } else {
      // 在非开发环境下，不传递 devInfo 参数
      triggerSignal(this.proxy, type)
    }
  }
  /**
   * 跟踪信号的方法
   * @param type - 信号操作类型，指定要跟踪的信号操作类型
   * @param devInfo - 可选参数，设备信息对象，包含设备的额外信息
   * 该方法用于跟踪与代理对象相关的信号操作，将相关信息传递给trackSignal函数
   */
  protected trackSignal(type: SignalOpType, devInfo?: DebuggerEventOptions) {
    trackSignal(this.proxy, type, devInfo) // 调用trackSignal函数，传入代理对象、操作类型和设备信息
  }
}

/**
 * 清除集合中所有元素的高阶函数
 * @param collection - CollectionProxyHandler类型的集合代理处理器，可以是Set或Map
 * @returns 返回一个无参数函数，执行时会清除集合中的所有元素
 */
export function collectionClear(collection: CollectionProxy<any>) {
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
