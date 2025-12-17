import { isObject, logger } from '@vitarx/utils'
import { IS_RAW_SYMBOL, READONLY_SYMBOL } from '../../constants/index.js'
import type { ReadonlyProxy } from '../../types/signal/readonly.js'
import { readSignal } from '../utils/index.js'

class ReadonlyHandler<T extends object> implements ProxyHandler<T> {
  constructor(private readonly deep: boolean) {}

  get(target: T, prop: any, receiver: any): any {
    if (prop === IS_RAW_SYMBOL) return true
    if (prop === READONLY_SYMBOL) return true
    let value = Reflect.get(target, prop, receiver)
    if (this.deep && isObject(value) && !value[READONLY_SYMBOL]) {
      return createReadonlyProxy(value, true)
    }
    value = readSignal(value)
    if (typeof value === 'function') return value.bind(target)
    return value
  }

  set(_target: any, prop: any, _value: any): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be set!`
    )
    return false
  }

  deleteProperty(_target: any, prop: any): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be removed!`
    )
    return false
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

export function createReadonlyProxy<T extends Object, Deep extends boolean = true>(
  target: T,
  deep: boolean
): ReadonlyProxy<T, Deep> {
  const cached = getCache(target, deep)
  if (cached) return cached as any
  const p = new Proxy(target, new ReadonlyHandler<T>(deep))
  return setCache(target, p, deep) as any
}
