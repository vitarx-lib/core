import { type ExtractProp } from './helper.js'
import { Observers } from '../observer/index.js'
import { isObject } from '../../utils/index.js'

/** 只读对象标识 */
export const READONLY_OBJECT_SYMBOL = Symbol('READONLY_OBJECT_SYMBOL')

/**
 * 只读代理
 */
class ReadonlyHandler<T extends Object> implements ProxyHandler<T> {
  static #cache = new WeakMap()

  constructor(private deep: boolean) {}

  /**
   * 创建深层只读代理
   *
   * @param target
   * @param deep
   */
  static create<T extends Object>(target: T, deep: true): DeepReadonly<T>
  /**
   * 创建浅层只读代理
   *
   * @param target
   * @param deep
   */
  static create<T extends Object>(target: T, deep: false): Readonly<T>
  static create<T extends Object>(target: T, deep: boolean): T {
    if (!this.#cache.has(target)) {
      this.#cache.set(target, new Proxy(target, new ReadonlyHandler<T>(deep)))
    }
    return this.#cache.get(target)!
  }

  set(_t: any, prop: any): boolean {
    console.warn(`[Vitarx.ReadonlyHandler][WARN]：对象是只读的，不可修改${String(prop)}属性！`)
    return true
  }

  deleteProperty(_t: any, prop: any): boolean {
    console.warn(`[Vitarx.ReadonlyHandler][WARN]：对象是只读的，不可删除${String(prop)}属性！`)
    return true
  }

  get(target: T, prop: ExtractProp<T>, receiver: any): any {
    // 只读标识
    if (prop === READONLY_OBJECT_SYMBOL) return true
    // 返回监听目标
    if (prop === Observers.OBSERVERS_TARGET_SYMBOL) return target
    const data = Reflect.get(target, prop, receiver)
    if (this.deep && isObject(data) && !isReadonly(data)) {
      return ReadonlyHandler.create(data, true)
    }
    return data
  }
}

/**
 * 深度只读对象
 *
 * 使用场景，需要提供响应式对象，又不想外部修改响应式对象，
 * 则可以传入响应式对象，然后把只读对象提供给外部使用。
 *
 * @param {Object} target - 任意对象
 * @returns {Object}
 */
export function readonly<T extends AnyObject>(target: T): DeepReadonly<T> {
  return ReadonlyHandler.create(target, true) as DeepReadonly<T>
}

/**
 * 浅层只读对象
 *
 * 使用场景，需要提供响应式对象，又不想外部修改响应式对象直接属性值，
 * 则可以传入响应式对象，然后把只读对象提供给外部使用。
 *
 * @param {Object} target - 任意对象
 * @returns {Object}
 */
export function shallowReadonly<T extends AnyObject>(target: T): Readonly<T> {
  return ReadonlyHandler.create(target, false)
}

/**
 * 判断是否为只读对象
 *
 * 只能判断是否为只读对象，不能判断是否为响应式对象！
 *
 * @param obj
 */
export function isReadonly<T extends object>(obj: T): boolean {
  return isObject(obj) && !!Reflect.get(obj, READONLY_OBJECT_SYMBOL)
}
