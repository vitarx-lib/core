import { DeepReadonly, isObject } from '@vitarx/utils'
import { SubManager } from '../../observer/index.js'

export type WriteHandleMode = 'error' | 'warning' | 'warningAndWrite'

/**
 * 只读选项接口
 */
export interface ReadonlyOptions<Deep extends boolean = boolean> {
  /**
   * 是否深度只读
   * @default true
   */
  deep?: Deep
  /**
   * 写入行为处理模式
   * - error: 抛出错误
   * - warning: 仅警告
   * - warningAndWrite: 警告并允许写入
   *
   * @default "error"
   */
  write?: WriteHandleMode
  /**
   * 要输出的信息
   *
   * 支持 ${prop} 占位符
   *
   * @default "The object is read-only, and the ${prop} attribute cannot be removed!"
   */
  message?: string
}

/** 只读对象标识 */
const READONLY_OBJECT_SYMBOL = Symbol('READONLY_OBJECT_SYMBOL')
/**
 * 只读代理
 */
export class ReadonlyHandler<T extends object> implements ProxyHandler<T> {
  static #cache = new WeakMap()
  readonly #options: Required<ReadonlyOptions>

  protected constructor(options?: ReadonlyOptions) {
    this.#options = {
      deep: options?.deep ?? true,
      write: options?.write ?? 'error',
      message: 'the object is read-only, and the ${prop} attribute cannot be modify!'
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
      throw new Error(this.createMessage(prop, 'ERROR'))
    }
    if (import.meta.env.DEV) console.warn(this.createMessage(prop, 'WARN'))
    if (this.#options.write === 'warningAndWrite') {
      return Reflect.set(target, prop, value)
    }
    return true
  }

  deleteProperty(target: any, prop: any): boolean {
    if (this.#options.write === 'error') {
      throw new Error(this.createMessage(prop, 'ERROR'))
    }
    if (import.meta.env.DEV) console.warn(this.createMessage(prop, 'WARN'))
    if (this.#options.write === 'warningAndWrite') {
      return Reflect.deleteProperty(target, prop)
    }
    return true
  }

  /**
   * 创建提示信息
   *
   * @param prop
   * @param type
   * @private
   */
  private createMessage(prop: any, type: 'ERROR' | 'WARN') {
    return `[Readonly][${type}]：` + this.#options.message!.replace('${prop}', String(prop))
  }

  get(target: T, prop: any, receiver: any): any {
    // 只读标识
    if (prop === READONLY_OBJECT_SYMBOL) return true
    // 返回监听目标
    if (prop === SubManager.TARGET_SYMBOL) return target
    const data = Reflect.get(target, prop, receiver)
    if (this.#options.deep && isObject(data) && !isReadonly(data)) {
      return ReadonlyHandler.create(data, this.#options)
    }
    return data
  }
}

/**
 * ## 判断是否为只读对象
 *
 * 检查一个值是否是通过 `readonly()` 或 `shallowReadonly()` 创建的只读代理对象。
 * 注意：此函数仅检查对象是否为只读代理，不能用于判断对象是否为响应式对象。
 *
 * @template T - 要检查的对象类型
 * @param {T} obj - 要检查的对象
 * @returns {boolean} 如果对象是只读代理则返回true，否则返回false
 * @example
 * ```typescript
 * const original = { count: 0 }
 * const readonlyObj = readonly(original)
 * const shallowReadonlyObj = shallowReadonly(original)
 *
 * isReadonly(readonlyObj) // true
 * isReadonly(shallowReadonlyObj) // true
 * isReadonly(original) // false
 * isReadonly(null) // false
 * ```
 */
export function isReadonly(obj: any): boolean {
  return obj?.[READONLY_OBJECT_SYMBOL] === true
}
