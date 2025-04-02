import { isCollection, isObject } from '@vitarx/utils'
import { isMarkNotSignal, isSignal, isValueSignal } from '../utils'
import { Observer } from '../../observer/index'
import { Depend } from '../../depend/index'
import type { Reactive, ReactiveOptions, ShallowReactive } from './types'
import type { BaseSignal, EqualityFn } from '../types'
import {
  DEEP_SIGNAL_SYMBOL,
  GET_RAW_TARGET_SYMBOL,
  PROXY_SIGNAL_SYMBOL,
  SIGNAL_SYMBOL
} from '../constants'
import { SignalManager } from '../manager'

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
   */
  private static readonly collectionWriteMethods = ['set', 'add', 'delete', 'clear']
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
  private readonly options: Required<ReactiveOptions>
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
   * @param {ReactiveOptions} [options] - 代理配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理
   * @param {EqualityFn} [options.equalityFn=Object.is] - 值比较函数
   */
  constructor(
    private readonly _target: T,
    options?: ReactiveOptions
  ) {
    this.options = {
      deep: true,
      equalityFn: Object.is,
      ...options
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
  get(target: T, prop: keyof T): any {
    // 拦截内部标识符属性
    if (typeof prop === 'symbol') {
      if (prop === SIGNAL_SYMBOL) return true
      if (prop === DEEP_SIGNAL_SYMBOL) return this.options.deep
      if (prop === PROXY_SIGNAL_SYMBOL) return true
      if (prop === GET_RAW_TARGET_SYMBOL) return target
      if (prop === Observer.TARGET_SYMBOL) return this.proxy
    } else if (
      this.collectionMethodProxy &&
      ReactiveProxyHandler.collectionWriteMethods.includes(prop as string)
    ) {
      // 放回集合方法代理
      return this.collectionMethodProxy
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
        return isValueSignal(value) ? value.value : value
      }
      // 如果不是被标记为不代理的则创建子代理并添加映射关系
      if (!isMarkNotSignal(value)) {
        // 创建子代理
        const childProxy = createReactiveProxySignal(value, this.options)
        // 映射父级关系
        SignalManager.addParent(childProxy, this.proxy, prop)
        this.childSignalMap.set(prop, childProxy)
        return childProxy
      }
    }
    // 如果值不是一个信号则上报给依赖管理器跟踪
    if (!isSignal(value)) this.track(prop)
    // 如果是值代理则返回被代理的值
    return this.options.deep && isValueSignal(value) ? value.value : value
  }

  /**
   * 删除属性的代理方法
   *
   * @param {T} target - 目标对象
   * @param {keyof T} prop - 要删除的属性名
   * @returns {boolean} 删除是否成功
   */
  deleteProperty(target: T, prop: keyof T): boolean {
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
  has(target: T, prop: keyof T): boolean {
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
  set(target: T, prop: keyof T, newValue: any): boolean {
    const oldValue = Reflect.get(target, prop)
    if (this.options.equalityFn(oldValue, newValue)) return true
    // 删除子代理
    this.removeChildSignal(prop)
    if (isValueSignal(oldValue)) {
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
  private notify(prop: keyof T) {
    Observer.notify(this.proxy, prop)
    const parentMap = SignalManager.getParents(this.proxy)
    if (!parentMap) return
    // 通知父级
    for (const [parent, keys] of parentMap) {
      Observer.notify(parent, Array.from(keys))
    }
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
 * @param {EqualityFn} [options.equalityFn=Object.is] - 自定义值比较函数
 * @returns {Reactive<T> | ShallowReactive<T>} 响应式代理对象
 * @example
 * ```typescript
 * const proxy = createReactiveProxy(target, {
 *   deep: true,
 *   equalityFn: (a, b) => a === b
 * })
 * ```
 */
export function createReactiveProxySignal<T extends AnyObject>(
  target: T,
  options?: ReactiveOptions
): Reactive<T> | ShallowReactive<T> {
  return new ReactiveProxyHandler(target, options).proxy
}
