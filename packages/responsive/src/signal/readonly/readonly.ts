import { isObject, logger } from '@vitarx/utils'
import { IS_RAW_SYMBOL, READONLY_SYMBOL } from '../../constants/index.js'
import type { ReadonlyOptions, ReadonlyProxy } from '../../types/signal/readonly.js'
import { readSignal } from '../utils/index.js'

/**
 * 只读代理
 */
class ReadonlyHandler<T extends object> implements ProxyHandler<T> {
  public readonly options: Required<ReadonlyOptions>

  constructor(options: Required<ReadonlyOptions>) {
    this.options = options
  }

  set(target: any, prop: any, value: any): boolean {
    if (this.options.write === 'error') {
      throw new Error(this.createMessage(prop))
    }
    logger.warn(this.createMessage(prop))
    if (this.options.write === 'warningAndWrite') {
      return Reflect.set(target, prop, value)
    }
    return true
  }

  deleteProperty(target: any, prop: any): boolean {
    if (this.options.write === 'error') {
      throw new Error(this.createMessage(prop))
    }
    logger.warn(this.createMessage(prop))
    if (this.options.write === 'warningAndWrite') {
      return Reflect.deleteProperty(target, prop)
    }
    return true
  }

  get(target: T, prop: any, receiver: any): any {
    if (prop === IS_RAW_SYMBOL) return true
    if (prop === READONLY_SYMBOL) return true
    const data = Reflect.get(target, prop, receiver)
    if (this.options.deep && isObject(data) && !data[READONLY_SYMBOL]) {
      return createReadonly(data, this.options)
    }
    if (typeof data === 'function') return data.bind(target)
    return readSignal(data)
  }

  /**
   * 创建提示信息
   *
   * @param prop
   * @private
   */
  private createMessage(prop: any) {
    return this.options.message!.replace('${prop}', String(prop))
  }
}
/**
 * 响应式对象缓存，用于存储已创建的响应式代理对象
 *
 * 使用 WeakMap 来避免内存泄漏，确保当原始对象被垃圾回收时，
 * 对应的代理对象也能被正确回收。
 */
const readonlyCache = new WeakMap<object, object>()
const shallowReadonlyCache = new WeakMap<object, object>()
const getCache = <T extends object>(target: T, deep: boolean) =>
  deep ? readonlyCache.get(target) : shallowReadonlyCache.get(target)
const setCache = (target: object, proxy: object, deep: boolean) => {
  deep ? readonlyCache.set(target, proxy) : shallowReadonlyCache.set(target, proxy)
  return proxy
}
export function createReadonly<T extends Object, Deep extends boolean = true>(
  target: T,
  options: Required<ReadonlyOptions<Deep>>
): ReadonlyProxy<T, Deep> {
  const cached = getCache(target, options.deep)
  if (cached) return cached as any
  const p = new Proxy(target, new ReadonlyHandler<T>(options))
  return setCache(target, p, options.deep) as any
}
