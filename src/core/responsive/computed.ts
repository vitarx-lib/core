import type { ValueProxy } from './helper.js'
import { PROXY_DEEP_SYMBOL, PROXY_SYMBOL, VALUE_PROXY_SYMBOL } from './constants.js'
import { Depend } from './depend.js'
import { Listener, Observers } from '../observer/index.js'
import { microTaskDebouncedCallback } from '../../utils/index.js'

export type ComputedOptions<T> = {
  /**
   * 计算属性的setter处理函数
   *
   * 计算属性一般是不允许修改的，如果你需要处理修改计算属性值，可以传入setter参数，
   *
   * setter参数是一个函数，接受一个参数，就是新的值，你可以在这里进行一些操作，比如修改依赖的值，但是不能修改计算属性的值。
   *
   * @example
   *
   * ```ts
   * const count = ref(0)
   * const double = computed(() => count.value * 2, {
   *   setter: (newValue) => {
   *     count.value = newValue / 2
   *   }
   * })
   * double.value = 10
   * console.log(double.value) // 5
   * ```
   *
   * @param newValue - 新的值
   */
  setter?: (newValue: T) => void
  /**
   * 惰性计算
   *
   * 如果设置为false，计算属性创建就会立即计算结果。
   *
   * @default true
   */
  lazy?: boolean
  /**
   * 是否允许自动销毁
   *
   * 如果设置为false时，它不会随作用域销毁。
   *
   * 使用场景：初始化时机在局部作用域中，需要局部作用域销毁时，不销毁计算属性。
   *
   * @default true
   */
  autoDestroy?: boolean
}
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
  // getter函数
  readonly #getter: () => T
  #options: ComputedOptions<T>
  // 监听器
  #listener?: Listener

  /**
   * 构造一个计算属性对象
   *
   * @param {function} getter - 计算属性的getter函数
   * @param {object} options - 计算属性的选项
   * @param {function} options.setter - 计算属性的setter函数
   * @param {boolean} [options.lazy=true] - 惰性计算
   * @param {boolean} [options.autoDestroy=true] - 自动销毁标识
   */
  constructor(getter: () => T, options: ComputedOptions<T> = {}) {
    this.#getter = getter
    this.#result = undefined as T
    this.#options = { lazy: true, autoDestroy: true, ...options }
    if (!this.#options.lazy) this.init()
  }

  /**
   * 获取计算结果
   *
   * @returns - 计算结果
   */
  get value(): T {
    if (!this.#initialize) this.init()
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
    if (typeof this.#options.setter === 'function') {
      this.#options.setter(newValue)
    } else {
      console.warn('[Vitarx.Computed][WARN]:不应该对计算属性进行写入，除非定义了setter。')
    }
  }

  /**
   * 设置自动销毁标识
   *
   * @param allow - 是否允许自动销毁，如果已初始化计算结果则无效。
   * @returns {this}
   */
  autoDestroy(allow: boolean): this {
    this.#options.autoDestroy = allow
    return this
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
   *
   * @template T - 计算结果类型
   * @returns {T} - 计算结果
   */
  stop(): T {
    if (this.#listener) {
      this.#listener.destroy()
      this.#listener = undefined
    }
    return this.#result
  }

  /**
   * 手动初始化计算属性
   */
  init() {
    if (!this.#initialize) {
      this.#initialize = true
      const { result, deps } = Depend.collect(this.#getter, 'self')
      this.#result = result
      if (deps.size > 0) {
        // 主监听器，用于依赖更新
        this.#listener = new Listener(
          microTaskDebouncedCallback(() => {
            const newResult = this.#getter()
            if (newResult !== this.#result) {
              this.#result = newResult
              Observers.trigger(this, 'value' as any)
            }
          }),
          { scope: false }
        )
        deps.forEach((props, proxy) => {
          Observers.registerProps(proxy, props, this.#listener!, { batch: false })
        })
        // 销毁时，取消对依赖的监听
        this.#listener.onDestroyed(() => (this.#listener = undefined))
      }
    }
    return this
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
 * @param {object} options - 计算属性的选项
 * @param {function} options.setter - 计算属性的setter函数
 * @param {boolean} [options.lazy=true] - 惰性计算标识
 * @param {boolean} [options.autoDestroy=true] - 自动销毁标识
 * @returns {Computed<T>} - 计算属性对象
 */
export function computed<T>(getter: () => T, options?: ComputedOptions<T>): Computed<T> {
  return new Computed(getter, options)
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
 * 解除`Computed`计算属性
 *
 * 它会停止对依赖的监听，并返回其value属性值。
 *
 * @template T - 任意类型
 * @param computed - 如果传入的是`Computed`对象则返回其value属性值，否则返回原值
 */
export function unComputed<T>(computed: T | Computed<T>): T {
  return isComputed(computed) ? computed.stop() : computed
}
