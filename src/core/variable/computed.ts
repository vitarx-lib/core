import type { ValueProxy } from './helper.js'
import { PROXY_DEEP_SYMBOL, PROXY_SYMBOL, VALUE_PROXY_SYMBOL } from './constants.js'
import { Depend } from './depend.js'
import { Listener, Observers } from '../observer'

/**
 * # 计算属性
 *
 * 计算属性是依赖收集的一种实现，可以监听多个依赖的变化，当依赖发生变化时，会重新运行计算函数，并更新结果。
 *
 * 计算属性从本质上也是响应式对象，这也就意味着计算属性自身也能做为一个响应式对象依赖被引用或监听。
 *
 * 与`Ref`代理对象的使用方式几乎是一致的，但不同的是它的`value`一般是只读的，因为`value`是根据依赖变化而变化的。
 */
export class Computed<T> implements ValueProxy<T> {
  // 标识为代理对象
  readonly [PROXY_SYMBOL] = true
  // 深度代理标识
  readonly [PROXY_DEEP_SYMBOL] = false
  // 标识为值代理对象
  readonly [VALUE_PROXY_SYMBOL] = true
  // 计算结果
  #result: T
  // 初始化标识
  #initialize: boolean = false
  readonly #getter
  readonly #setter
  // 监听器
  #listener?: Listener

  /**
   * 构造一个计算属性对象
   *
   * @param getter - 计算属性的getter函数
   * @param setter - 计算属性的setter函数
   */
  constructor(getter: () => T, setter?: (newValue: T) => void) {
    this.#getter = getter
    this.#setter = setter
    this.#result = undefined as T
  }

  /**
   * 获取计算结果
   *
   * @returns - 计算结果
   */
  get value(): T {
    if (!this.#initialize) this.#init()
    Depend.track(this, 'value')
    return this.#result
  }

  /**
   * 修改计算结果
   *
   * 如果没有setter，则打印警告
   *
   * @param newValue
   */
  set value(newValue: T) {
    if (this.#setter) {
      this.#setter(newValue)
    } else {
      console.warn('不应该对计算属性进行写入，除非定义了setter。')
    }
  }

  /**
   * 转字符串方法
   *
   * @returns - 转换后的字符串
   */
  toString() {
    if (this.#result?.toString) {
      return this.#result.toString()
    } else {
      return `[Object Computed<${typeof this.#result}>]`
    }
  }

  /**
   * 停止监听依赖变化
   *
   * 调用此方法会停止对依赖的监听，并释放相关监听器。
   */
  stop() {
    if (this.#listener) {
      this.#listener.destroy()
      this.#listener = undefined
    }
  }

  /**
   * 初始化计算属性
   *
   * @private
   */
  #init() {
    if (!this.#initialize) {
      this.#initialize = true
      const { result, deps } = Depend.collect(this.#getter)
      this.#result = result
      if (deps.size > 0) {
        // 主监听器，用于依赖更新
        this.#listener = Observers.register(deps, () => {
          const newResult = this.#getter()
          if (newResult !== this.#result) {
            this.#result = newResult
            Observers.trigger(this, 'value' as any)
          }
        })
        // 依赖变更标记
        const change = Symbol('computed depend change')
        // 监听依赖的变化
        const subListener = new Listener(function () {
          Observers.trigger(deps, change as any)
        })
        deps.forEach((props, proxy) => {
          Observers.registerProps(proxy, props, subListener)
        })
        // 销毁时，取消对依赖的监听
        this.#listener.onDestroyed(() => {
          subListener.destroy()
          this.#listener = undefined
        })
      }
    }
  }
}

/**
 * ## 创建一个计算属性
 *
 * 根据getter和setter创建一个计算属性，并返回一个计算属性对象。
 *
 * 计算属性的getter函数会在函数依赖发生变化时，自动执行，并返回新的计算结果。
 *
 * @template T - 结果值类型
 * @param {() => T} getter - 计算属性的getter函数
 * @param {(newValue: T) => void} setter - 计算属性的setter函数，只能修改计算属性的依赖值
 */
export function computed<T>(getter: () => T, setter?: (newValue: T) => void): Computed<T> {
  return new Computed(getter, setter)
}

/**
 * 判断是否为计算属性对象
 *
 * @param val
 */
export function isComputed(val: any): val is Computed<any> {
  return val instanceof Computed
}

/**
 * 解除`Computed`对象，返回其value属性值
 *
 * @template T - 任意类型
 * @param computed - 如果传入的是`Computed`对象则返回其value属性值，否则返回原值
 */
export function unComputed<T>(computed: T | Computed<T>): T {
  return isComputed(computed) ? computed.value : computed
}
