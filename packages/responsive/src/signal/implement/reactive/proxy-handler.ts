import { isObject } from '@vitarx/utils'
import { Depend } from '../../../depend/index'
import { Observer } from '../../../observer/index'
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
} from '../../core/index'
import type { Reactive } from './types'

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
class ReactiveProxyHandler<T extends AnyObject, Deep extends boolean = true>
  implements ProxyHandler<T>
{
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
  private static readonly staticSymbol = [SIGNAL_SYMBOL, PROXY_SIGNAL_SYMBOL, REACTIVE_PROXY_SYMBOL]
  /**
   * 代理对象
   *
   * @private
   */
  public readonly proxy: Reactive<T, Deep>
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
   * 创建响应式代理对象处理器实例
   * @param {T} _target - 需要被代理的目标对象
   * @param {SignalOptions} [options] - 代理配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理
   * @param {CompareFunction} [options.compare=Object.is] - 值比较函数
   */
  constructor(
    private readonly _target: T,
    options?: SignalOptions<Deep>
  ) {
    this.options = {
      compare: options?.compare ?? Object.is,
      deep: options?.deep ?? true
    }
    this.childSignalMap = this.options.deep ? new Map() : undefined
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
      if (ReactiveProxyHandler.staticSymbol.includes(prop)) return true
      if (prop === DEEP_SIGNAL_SYMBOL) return this.options.deep
      if (prop === SIGNAL_RAW_VALUE_SYMBOL) return target
      if (prop === Observer.TARGET_SYMBOL) return this.proxy
    }
    // 获取值
    const value = Reflect.get(target, prop, target)
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
      // 创建子代理
      const childProxy = new ReactiveProxyHandler(value, { ...this.options }).proxy
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
   * @returns {boolean} 设置是否成功
   */
  set(target: T, prop: AnyKey, newValue: any): boolean {
    const oldValue = Reflect.get(target, prop)
    if (this.options.compare(oldValue, newValue)) return true
    // 删除子代理
    this.removeChildSignal(prop)
    if (isRefSignal(oldValue)) {
      oldValue.value = newValue
    } else if (!Reflect.set(target, prop, newValue, target)) {
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
  const triggerSizeChange = (operation: (...args: any[]) => void) => {
    return (...args: any[]) => {
      const oldSize = (target as any).size
      operation.apply(target, args)
      if ((target as any).size !== oldSize) SignalManager.notifySubscribers(proxy, 'size')
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
          return triggerSizeChange(target.clear)
        }
        if (type === 'set' && prop === 'add') {
          return triggerSizeChange(target.add)
        }
        if (type === 'map' && prop === 'set') {
          return triggerSizeChange(target.set)
        }
      }
      Depend.track(proxy, 'size')
      return Reflect.get(target, prop, target)
    }
  })
  return proxy as any
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
  const type = target instanceof Set ? 'set' : target instanceof Map ? 'map' : 'object'
  if (type === 'set' || type === 'map') {
    return createCollectionProxy(target, type) as Reactive<T, Deep>
  }
  return new ReactiveProxyHandler(target, options).proxy
}
