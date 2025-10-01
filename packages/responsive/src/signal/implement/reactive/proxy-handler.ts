import { AnyKey, AnyObject, isObject } from '@vitarx/utils'
import { Depend } from '../../../depend/index.js'
import { Observer } from '../../../observer/index.js'
import {
  type BaseSignal,
  DEEP_SIGNAL_SYMBOL,
  isMarkNotSignal,
  isProxySignal,
  isRefSignal,
  isSignal,
  PROXY_SIGNAL_SYMBOL,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL,
  SignalManager,
  type SignalOptions
} from '../../core/index.js'
import type { Reactive } from './types.js'

/**
 * 响应式代理对象标识符
 */
export const REACTIVE_PROXY_SYMBOL = Symbol('REACTIVE_PROXY_SYMBOL')
const STATIC_SYMBOL = [SIGNAL_SYMBOL, PROXY_SIGNAL_SYMBOL, REACTIVE_PROXY_SYMBOL]
/**
 * # 响应式代理对象处理器
 *
 * 实现了ES6 Proxy的处理器接口，用于创建响应式对象
 *
 * @template T - 目标对象类型，必须是一个对象类型
 * @template Deep - 是否深度代理
 * @implements {ProxyHandler<T>}
 * @example
 * ```typescript
 * const target = { count: 0 }
 * const handler = new ReactiveProxyHandler(target)
 * const proxy = handler.proxy
 * // 现在proxy是一个响应式对象
 * ```
 */
export class ReactiveProxyHandler<T extends AnyObject, Deep extends boolean = true>
  implements ProxyHandler<T>
{
  protected readonly target: AnyObject
  /**
   * 代理对象配置
   */
  protected readonly options: Required<SignalOptions>
  /**
   * 子代理映射
   */
  protected readonly childSignalMap?: Map<AnyKey, BaseSignal>
  /**
   * 是否数组
   */
  protected readonly isArray: boolean
  /**
   * 代理对象
   */
  #proxy: Reactive<T, Deep> | null = null

  /**
   * 创建响应式代理对象处理器实例
   * @param target
   * @param {SignalOptions} [options] - 代理配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理
   * @param {CompareFunction} [options.compare=Object.is] - 值比较函数
   */
  constructor(target: T, options?: SignalOptions<Deep>) {
    this.options = {
      compare: options?.compare ?? Object.is,
      deep: options?.deep ?? true
    }
    this.childSignalMap = this.options.deep ? new Map() : undefined
    this.target = target
    this.isArray = Array.isArray(target)
  }

  /**
   * 获取响应式代理对象的getter方法
   * 使用Proxy实现响应式，当访问属性时会触发相应的操作
   * @returns {Reactive<T, Deep>} 返回一个响应式代理对象
   */
  get proxy(): Reactive<T, Deep> {
    // 如果代理对象不存在，则创建一个新的代理对象
    if (!this.#proxy) {
      // 使用Proxy构造函数创建代理，将this作为handler处理器
      // 并将结果断言为Reactive<T, Deep>类型
      this.#proxy = new Proxy(this.target, this) as Reactive<T, Deep>
    }
    // 返回已经创建的代理对象
    return this.#proxy
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
   * @param receiver - 代理或从代理继承的对象。
   * @returns {any} 属性值
   */
  get(target: T, prop: AnyKey, receiver: any): any {
    // 拦截内部标识符属性
    if (typeof prop === 'symbol') {
      if (STATIC_SYMBOL.includes(prop)) return true
      if (prop === DEEP_SIGNAL_SYMBOL) return this.options.deep
      if (prop === SIGNAL_RAW_VALUE_SYMBOL) return target
      if (prop === Observer.TARGET_SYMBOL) return receiver
    }
    // 获取值
    const value = Reflect.get(target, prop, receiver)
    // 如果访问的是数组的函数时，则直接返回，不继续往下执行
    if (this.isArray && typeof value === 'function') {
      this.track('length')
      return value
    }
    // 惰性深度代理
    if (this.childSignalMap && isObject(value) && !isMarkNotSignal(value)) {
      // 已经创建过子代理则直接返回
      if (this.childSignalMap.has(prop)) {
        return this.childSignalMap.get(prop)
      }
      // 如果是信号则判断则添加映射关系
      if (isSignal(value)) {
        this.childSignalMap.set(prop, value)
        SignalManager.bindParent(value, this.proxy, prop)
        return isRefSignal(value) ? value.value : value
      }
      const type = getObjectType(value)
      let childProxy: Reactive
      if (type === 'object') {
        childProxy = createReactiveProxySignal(value, { ...this.options })
      } else {
        childProxy = createCollectionProxy(value, type)
      }
      // 映射父级关系
      SignalManager.bindParent(childProxy, this.proxy, prop)
      this.childSignalMap.set(prop, childProxy)
      return childProxy
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
   * @param receiver - 代理或从代理继承的对象。
   * @returns {boolean} 设置是否成功
   */
  set(target: T, prop: AnyKey, newValue: any, receiver: any): boolean {
    const oldValue = Reflect.get(target, prop)
    if (prop === 'length' && this.isArray) {
      ;(target as []).length = newValue
      this.notify(prop)
      return true
    }
    if (this.options.compare(oldValue, newValue)) return true
    // 删除子代理
    this.removeChildSignal(prop)
    if (isRefSignal(oldValue)) {
      oldValue.value = newValue
    } else if (!Reflect.set(target, prop, newValue, receiver)) {
      return false
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
      SignalManager.unbindParent(this.childSignalMap.get(prop)!, this.proxy, prop)
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
    Depend.track(this.proxy as Record<AnyKey, any>, prop)
  }
}
/**
 * 辅助创建集合代理的函数
 *
 * @param target - 目标集合
 * @param type - 集合类型，'set' 或 'map'
 */
function createCollectionProxy(target: any, type: 'set' | 'map') {
  // 统一处理size变化的工具函数
  const triggerSizeChange = (method: string) => {
    return (...args: any[]) => {
      const oldSize = target.size
      const result = target[method](...args)
      if ((target as any).size !== oldSize) SignalManager.notifySubscribers(proxy, 'size')
      return result
    }
  }
  const proxy = new Proxy(target, {
    get(target: any, prop: string | symbol, receiver: any): any {
      if (prop === SIGNAL_SYMBOL || prop === PROXY_SIGNAL_SYMBOL || prop === REACTIVE_PROXY_SYMBOL)
        return true
      if (prop === DEEP_SIGNAL_SYMBOL) return false
      if (prop === SIGNAL_RAW_VALUE_SYMBOL) return target
      if (prop === Observer.TARGET_SYMBOL) return proxy
      if (typeof prop === 'string') {
        if (prop === 'clear' || prop === 'delete') {
          return triggerSizeChange(prop)
        }
        if (type === 'set' && prop === 'add') {
          return triggerSizeChange(prop)
        }
        if (type === 'map' && prop === 'set') {
          return triggerSizeChange(prop)
        }
      }
      Depend.track(proxy, 'size')
      const value = Reflect.get(target, prop, receiver)
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    }
  })
  return proxy as any
}

/**
 * 判断目标对象的类型
 *
 * @param target - 需要判断类型的任意对象
 * @returns 返回对象的类型，可能是 'object'、'set' 或 'map'
 */
function getObjectType(target: AnyObject): 'object' | 'set' | 'map' {
  // 首先检查是否为 Set 类型
  if (target instanceof Set) return 'set'
  // 然后检查是否为 Map 类型
  if (target instanceof Map) return 'map'
  // 如果既不是 Set 也不是 Map，则返回普通对象类型
  return 'object'
}
/**
 * ## 创建响应式代理信号
 *
 * @template T - 目标对象类型
 * @template Deep - 是否启用深度代理
 * @param {T} target - 要代理的目标对象
 * @param {object} options - 代理配置选项
 * @param {boolean} [options.deep=true] - 启用深度代理
 * @param {CompareFunction} [options.compare=Object.is] - 自定义值比较函数
 * @returns {Reactive<T,Deep>} 响应式代理对象
 * @example
 * const proxy = createReactiveProxy(target, {
 *   deep: true,
 *   compare: (a, b) => a === b
 * })
 */
export function createReactiveProxySignal<T extends AnyObject, Deep extends boolean = true>(
  target: T,
  options?: SignalOptions<Deep>
): Reactive<T, Deep> {
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
  if (isProxySignal(target)) return target as Reactive<T, Deep>
  const type = getObjectType(target)
  return type !== 'object'
    ? (createCollectionProxy(target, type) as Reactive<T, Deep>)
    : new ReactiveProxyHandler(target, options).proxy
}
