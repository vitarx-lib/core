import { isObject, logger } from '@vitarx/utils'
import type { DeepReadonly } from '@vitarx/utils/src/index.js'
import {
  type DeepUnwrapRefs,
  IS_RAW,
  IS_READONLY,
  isRef,
  RAW_VALUE,
  type RawValue,
  type UnwrapRefs
} from '../shared/index.js'

/**
 * 只读代理类型工具
 *
 * 根据 IsDeep 参数决定使用浅层还是深层只读代理：
 * - 当 IsDeep 为 true 时，使用 DeepReadonly 进行深度只读处理
 * - 当 IsDeep 为 false 时，使用 Readonly 进行浅层只读处理
 *
 * @template T - 对象类型
 * @template IsDeep - 是否进行深度处理
 *
 * @example
 * ```typescript
 * type User = { name: RefWrapper<string>; profile: { age: RefWrapper<number> } }
 *
 * // 深层只读
 * type DeepReadOnlyUser = ReadonlyProxy<User, true>
 * // 等价于 DeepReadonly<{ name: string; profile: { age: number } }>
 *
 * // 浅层只读
 * type ShallowReadOnlyUser = ReadonlyProxy<User, false>
 * // 等价于 Readonly<{ name: string; profile: { age: RefWrapper<number> } }>
 * ```
 */
export type ReadonlyObject<T extends object, IsDeep extends boolean> = (IsDeep extends true
  ? DeepReadonly<DeepUnwrapRefs<T>>
  : Readonly<UnwrapRefs<T>>) &
  RawValue<T>

/**
 * 只读代理处理器类
 * 该类实现了ProxyHandler接口，用于创建对象的只读代理
 * @template T - 必须是object类型的泛型参数
 */
class ReadonlyProxyHandler<T extends object> implements ProxyHandler<T> {
  constructor(private readonly deep: boolean) {}

  get(target: T, prop: any, receiver: any): any {
    if (prop === IS_RAW) return true
    if (prop === IS_READONLY) return true
    if (prop === RAW_VALUE) return target
    let value = Reflect.get(target, prop, receiver)
    if (isRef(value)) return value.value
    if (this.deep && isObject(value) && !value[IS_READONLY]) {
      return createReadonlyProxy(value, true)
    }
    if (typeof value === 'function') return value.bind(target)
    return value
  }

  set(_target: any, prop: any, _value: any): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be set!`
    )
    return true // Return true to avoid TypeError
  }

  deleteProperty(_target: any, prop: any): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be removed!`
    )
    return true // Return true to avoid TypeError
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

/**
 * 创建一个只读代理对象
 * @param target - 要代理的目标对象
 * @param deep - 是否深度代理
 * @returns 返回一个只读代理对象
 */
export function createReadonlyProxy<T extends Object, IsDeep extends boolean = true>(
  target: T, // 目标对象，将被代理
  deep: boolean // 是否深度代理的标志
): ReadonlyObject<T, IsDeep> {
  // 首先检查缓存中是否已存在相同的代理
  const cached = getCache(target, deep)
  // 如果存在，直接返回缓存的代理
  if (cached) return cached as any
  // 如果不存在，创建新的代理对象
  const p = new Proxy(target, new ReadonlyProxyHandler<T>(deep))
  // 将新创建的代理存入缓存并返回
  return setCache(target, p, deep) as any
}
