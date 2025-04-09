import { isObject } from '@vitarx/utils'
import { Observer } from '../../../observer/index'
import { isReadonly, READONLY_OBJECT_SYMBOL } from './helpers'
import type { ReadonlyOptions } from './types'

/**
 * 只读代理
 */
export class ReadonlyHandler<T extends object> implements ProxyHandler<T> {
  static #cache = new WeakMap()
  readonly #options: ReadonlyOptions

  protected constructor(options?: ReadonlyOptions) {
    this.#options = {
      deep: options?.deep ?? true,
      write: options?.write ?? 'error'
    }
  }

  /**
   * 创建只读代理
   *
   * @param target - 目标对象
   * @param options - 代理选项
   */
  static create<T extends Object, Deep extends boolean = true>(
    target: T,
    options?: ReadonlyOptions<Deep>
  ): Deep extends true ? DeepReadonly<T> : Readonly<T> {
    if (!this.#cache.has(target)) {
      this.#cache.set(target, new Proxy(target, new ReadonlyHandler<T>(options)))
    }
    return this.#cache.get(target)!
  }

  set(target: any, prop: any, value: any): boolean {
    if (this.#options.write === 'error') {
      throw new Error(
        `[Readonly][ERROR]：The object is read-only, and the ${String(
          prop
        )} attribute cannot be removed!`
      )
    }
    console.warn(
      `[Readonly][WARN]：The object is read-only, and the ${String(
        prop
      )} attribute cannot be removed!`
    )
    if (this.#options.write === 'warningAndWrite') {
      return Reflect.set(target, prop, value)
    }
    return true
  }

  deleteProperty(target: any, prop: any): boolean {
    if (this.#options.write === 'error') {
      throw new Error(
        `[Readonly][ERROR]：The object is read-only, and the ${String(
          prop
        )} attribute cannot be removed!`
      )
    }
    console.warn(
      `[Readonly][WARN]：The object is read-only, and the ${String(
        prop
      )} attribute cannot be removed!`
    )
    if (this.#options.write === 'warningAndWrite') {
      return Reflect.deleteProperty(target, prop)
    }
    return true
  }

  get(target: T, prop: any, receiver: any): any {
    // 只读标识
    if (prop === READONLY_OBJECT_SYMBOL) return true
    // 返回监听目标
    if (prop === Observer.TARGET_SYMBOL) return target
    const data = Reflect.get(target, prop, receiver)
    if (this.#options.deep && isObject(data) && !isReadonly(data)) {
      return ReadonlyHandler.create(data, this.#options)
    }
    return data
  }
}
