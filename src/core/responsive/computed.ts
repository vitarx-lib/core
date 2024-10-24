import { Dep } from './track-dependencies.js'
import { Listener } from './observer.js'
import { withWatcher } from './watch.js'
import { PLAIN_PROXY_SYMBOL, PROXY_SYMBOL } from './proxy.js'

/**
 * 计算属性对象
 */
export class Computed<T> {
  #result: T
  #initialize: boolean = false
  readonly #getter
  readonly #setter

  /**
   * @param getter - 计算属性的getter函数
   * @param setter - 计算属性的setter函数
   */
  constructor(getter: () => T, setter?: (newValue: T) => void) {
    this.#getter = getter
    this.#setter = setter
    Object.defineProperty(this, PROXY_SYMBOL, {
      value: []
    })
    Object.defineProperty(this, PLAIN_PROXY_SYMBOL, { value: true })
    this.#result = undefined as T
  }

  get value() {
    if (!this.#initialize) this.#init()
    Dep.track(this)
    return this.#result
  }

  set value(newValue: T) {
    if (this.#setter) {
      this.#setter(newValue)
    } else {
      console.warn('不应该对计算属性进行写入，除非定义了setter。')
    }
  }

  toString() {
    return this.value?.toString() || 'undefined'
  }

  #init() {
    if (!this.#initialize) {
      this.#initialize = true
      const { result, deps } = Dep.collect(this.#getter, true)
      this.#result = result
      if (deps.size > 0) {
        const listener = new Listener(() => {
          const oldResult = this.#result
          this.#result = this.#getter()
          withWatcher(this)?.trigger(['value'], this, { value: oldResult } as this)
        })
        for (const [proxy, keys] of deps) {
          withWatcher(proxy).register(Array.from(keys), listener)
        }
      }
    }
  }
}

/**
 * ## 创建一个计算属性
 *
 * 根据getter和setter创建一个计算属性，并返回一个计算属性对象
 *
 * @template T - 结果值类型
 * @param {() => T} getter - 计算属性的getter函数
 * @param {(newValue: T) => void} setter - 计算属性的setter函数，只能修改计算属性的依赖值
 */
export function computed<T>(getter: () => T, setter?: (newValue: T) => void): Computed<T> {
  return new Computed(getter, setter)
}
