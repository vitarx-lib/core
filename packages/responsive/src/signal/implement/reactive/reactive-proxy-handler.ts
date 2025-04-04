import { isCollection, isObject } from '@vitarx/utils'
import { Depend } from '../../../depend/index'
import { Observer } from '../../../observer/index'
import {
  type BaseSignal,
  DEEP_SIGNAL_SYMBOL,
  GET_RAW_TARGET_SYMBOL,
  isMarkNotSignal,
  isProxySignal,
  isRefSignal,
  isSignal,
  PROXY_SIGNAL_SYMBOL,
  SIGNAL_SYMBOL,
  SignalManager,
  type SignalOptions
} from '../../core/index'
import type { Reactive, ShallowReactive } from './types'

/**
 * 响应式代理对象标识符
 */
export const REACTIVE_PROXY_SYMBOL = Symbol('REACTIVE_PROXY_SYMBOL')
/**
 * # 响应式代理对象处理器
 *
 * 实现了ES6 Proxy的处理器接口，用于创建响应式对象
 *
 * @template T - 目标对象类型，必须是一个对象类型
 * @implements {ProxyHandler<T>}
 * @example
 * ```typescript
 * const target = { count: 0 }
 * const handler = new ReactiveProxyHandler(target)
 * const proxy = handler.proxy
 * // 现在proxy是一个响应式对象
 * ```
 */
class ReactiveProxyHandler<T extends AnyObject> implements ProxyHandler<T> {
  /**
   * 集合写入方法
   *
   * @private
   */
  private static readonly collectionWriteMethods = ['set', 'add', 'delete', 'clear']
  /**
   * 集合查询方法
   *
   * @private
   */
  private static readonly collectionQueryMethods = ['size', 'length', 'has']
  private static readonly staticSymbol = [SIGNAL_SYMBOL, PROXY_SIGNAL_SYMBOL, REACTIVE_PROXY_SYMBOL]
  /**
   * 代理对象
   *
   * @private
   */
  public readonly proxy: Reactive<T> | ShallowReactive<T>
  /**
   * 代理对象配置
   *
   * @private
   */
  private readonly options: Required<SignalOptions>
  /**
   * 子代理映射
   *
   * @private
   */
  private readonly childSignalMap?: Map<AnyKey, BaseSignal>
  /**
   * 集合方法代理
   *
   * @private
   */
  /**
   * 集合方法代理函数
   * 用于拦截和处理集合类型（如Map、Set等）的写入操作
   * @private
   * @type {null | AnyFunction}
   */
  private readonly collectionMethodProxy: null | AnyFunction

  /**
   * 创建响应式代理对象处理器实例
   * @param {T} _target - 需要被代理的目标对象
   * @param {SignalOptions} [options] - 代理配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理
   * @param {CompareFunction} [options.compare=Object.is] - 值比较函数
   */
  constructor(
    private readonly _target: T,
    options?: SignalOptions
  ) {
    this.options = {
      compare: options?.compare ?? Object.is,
      deep: options?.deep ?? true
    }
    this.childSignalMap = this.options.deep ? new Map() : undefined
    this.collectionMethodProxy = isCollection(this._target)
      ? (prop: string, ...args: any[]) => {
          const result = (this._target as any)[prop].apply(this._target, args)
          if (result) this.notify('size')
          return result
        }
      : null
    this.proxy = new Proxy(this._target, this) as unknown as any
  }

  /**
   * 获取属性值的代理方法
   * 实现了以下功能：
   * 1. 处理内部符号属性
   * 2. 处理集合方法代理
   * 3. 实现惰性深度代理
   * 4. 依赖收集
   *
   * @param {T} target - 目标对象
   * @param {keyof T} prop - 属性名
   * @returns {any} 属性值
   */
  get(target: T, prop: AnyKey): any {
    // 拦截内部标识符属性
    if (typeof prop === 'symbol') {
      if (ReactiveProxyHandler.staticSymbol.includes(SIGNAL_SYMBOL)) return true
      if (prop === DEEP_SIGNAL_SYMBOL) return this.options.deep
      if (prop === GET_RAW_TARGET_SYMBOL) return target
      if (prop === Observer.TARGET_SYMBOL) return this.proxy
    } else if (typeof prop === 'string' && this.collectionMethodProxy) {
      // 处理集合写入方法
      if (ReactiveProxyHandler.collectionWriteMethods.includes(prop)) {
        return this.collectionMethodProxy
      }
      // 处理集合查询方法
      if (ReactiveProxyHandler.collectionQueryMethods.includes(prop)) {
        this.track('size')
        return Reflect.get(target, prop, target)
      }
    }
    // 获取值
    const value = Reflect.get(target, prop, target)
    // 惰性深度代理
    if (this.childSignalMap && isObject(value)) {
      // 已经创建过子代理则直接返回
      if (this.childSignalMap.has(prop)) {
        return this.childSignalMap.get(prop)
      }
      // 如果是信号则判断则添加映射关系
      if (isSignal(value)) {
        this.childSignalMap.set(prop, value)
        SignalManager.addParent(value, this.proxy, prop)
        return isRefSignal(value) ? value.value : value
      }
      // 如果不是被标记为不代理的则创建子代理并添加映射关系
      if (!isMarkNotSignal(value)) {
        // 创建子代理
        const childProxy = new ReactiveProxyHandler(value, { ...this.options }).proxy
        // 映射父级关系
        SignalManager.addParent(childProxy, this.proxy, prop)
        this.childSignalMap.set(prop, childProxy)
        return childProxy
      }
    }
    // 如果值不是一个信号则上报给依赖管理器跟踪
    if (!isSignal(value)) this.track(prop)
    // 如果是值代理则返回被代理的值
    return this.options.deep && isRefSignal(value) ? value.value : value
  }

  /**
   * 删除属性的代理方法
   *
   * @param {T} target - 目标对象
   * @param {keyof T} prop - 要删除的属性名
   * @returns {boolean} 删除是否成功
   */
  deleteProperty(target: T, prop: AnyKey): boolean {
    if (!Reflect.deleteProperty(target, prop)) return false
    // 删除子代理
    this.removeChildSignal(prop)
    this.notify(prop)
    return true
  }

  /**
   * 检查属性是否存在的代理方法
   *
   * @param {T} target - 目标对象
   * @param {keyof T} prop - 要检查的属性名
   * @returns {boolean} 属性是否存在
   */
  has(target: T, prop: AnyKey): boolean {
    this.track(prop)
    return Reflect.has(target, prop)
  }

  /**
   * 设置属性值的代理方法
   *
   * @param {T} target - 目标对象
   * @param {keyof T} prop - 属性名
   * @param {any} newValue - 新的属性值
   * @returns {boolean} 设置是否成功
   */
  set(target: T, prop: AnyKey, newValue: any): boolean {
    const oldValue = Reflect.get(target, prop)
    if (this.options.compare(oldValue, newValue)) return true
    // 删除子代理
    this.removeChildSignal(prop)
    if (isRefSignal(oldValue)) {
      oldValue.value = newValue
    } else {
      if (!Reflect.set(target, prop, newValue, target)) return false
    }
    this.notify(prop)
    return true
  }

  /**
   * 删除子代理并清理相关引用关系
   * 用于在属性被删除或更新时清理对应的子代理
   *
   * @param {AnyKey} prop - 被删除的属性
   * @private
   */
  private removeChildSignal(prop: AnyKey) {
    if (this.childSignalMap && this.childSignalMap.has(prop)) {
      SignalManager.removeParent(this.childSignalMap.get(prop)!, this.proxy, prop)
      this.childSignalMap.delete(prop)
    }
  }

  /**
   * 通知观察者属性发生变化
   * 会同时通知当前对象的观察者和所有父级对象的观察者
   *
   * @param {keyof T} prop - 被修改的属性
   * @private
   */
  private notify(prop: AnyKey) {
    SignalManager.notifySubscribers(this.proxy, prop as any)
  }

  /**
   * 收集属性的依赖关系
   * 用于在属性被访问时收集依赖，实现响应式追踪
   *
   * @param {AnyKey} prop - 被访问的属性
   * @private
   */
  private track(prop: AnyKey) {
    Depend.track(this.proxy, prop)
  }
}

/**
 * ## 创建响应式代理信号
 *
 * @template T - 目标对象类型
 * @param {T} target - 要代理的目标对象
 * @param {object} options - 代理配置选项
 * @param {boolean} [options.deep=true] - 启用深度代理
 * @param {CompareFunction} [options.compare=Object.is] - 自定义值比较函数
 * @returns {Reactive<T> | ShallowReactive<T>} 响应式代理对象
 * @example
 * ```typescript
 * const proxy = createReactiveProxy(target, {
 *   deep: true,
 *   compare: (a, b) => a === b
 * })
 * ```
 */
export function createReactiveProxySignal<T extends AnyObject>(
  target: T,
  options?: SignalOptions
): Reactive<T> | ShallowReactive<T> {
  if (!isObject(target)) {
    throw new TypeError('Parameter 1 (target) must be an object!')
  }
  if (Object.isFrozen(target)) {
    throw new TypeError('Parameter 1 (target) cannot be a frozen object')
  }
  // 避免嵌套代理
  if (isRefSignal(target)) {
    throw new TypeError('Parameter 1 (target) cannot be a value reference object!')
  }
  if (isProxySignal(target)) return target as Reactive<T>
  return new ReactiveProxyHandler(target, options).proxy
}
