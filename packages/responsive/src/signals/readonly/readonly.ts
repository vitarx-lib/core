import type { AnyMap, AnySet, AnyWeakMap, AnyWeakSet } from '@vitarx/utils'
import { isObject, logger } from '@vitarx/utils'
import { IS_RAW, IS_READONLY, isRef, RAW_VALUE, type ReadonlyObject } from '../shared/index.js'
import { MapReadonlyHandler, WeakMapReadonlyHandler } from './map.js'
import { SetReadonlyHandler, WeakSetReadonlyHandler } from './set.js'

/**
 * 集合类型只读代理类型
 * 集合类型本身就是只读的，只需添加 RAW_VALUE 标识
 */
type ReadonlyCollection<T extends AnyMap | AnySet | AnyWeakMap | AnyWeakSet> = T & {
  readonly [RAW_VALUE]: T
}

/**
 * 只读代理处理器类
 * 该类实现了ProxyHandler接口，用于创建对象的只读代理
 * @template T - 必须是object类型的泛型参数
 */
class ReadonlyProxyHandler<T extends object> implements ProxyHandler<T> {
  constructor(private readonly deep: boolean) {}

  get(target: T, prop: string | symbol, _receiver: unknown): unknown {
    if (prop === IS_RAW) return true
    if (prop === IS_READONLY) return true
    if (prop === RAW_VALUE) return target
    const value = Reflect.get(target, prop, target)
    if (isRef(value)) return value.value
    if (this.deep && isObject(value) && !value[IS_READONLY]) {
      return createReadonlyProxy(value, true)
    }
    return value
  }

  set(_target: T, prop: string | symbol, _value: unknown): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be set!`
    )
    return true
  }

  deleteProperty(_target: T, prop: string | symbol): boolean {
    logger.warn(
      `[Readonly] The object is read-only, and the ${String(prop)} attribute cannot be removed!`
    )
    return true
  }
}
/**
 * 只读代理对象缓存
 * 使用 WeakMap 存储已创建的代理对象，避免重复创建
 * 当原始对象被垃圾回收时，对应的代理对象也会被自动回收
 */
const readonlyCache = new WeakMap<object, object>()

/**
 * 浅层只读代理对象缓存
 */
const shallowReadonlyCache = new WeakMap<object, object>()

/**
 * 集合类型只读代理对象缓存
 * 集合类型不区分深度/浅层，使用独立缓存
 */
const collectionReadonlyCache = new WeakMap<object, object>()

/**
 * 从缓存中获取普通对象的只读代理
 * @param target - 目标对象
 * @param deep - 是否深度代理
 * @returns 返回缓存的代理对象，不存在则返回 undefined
 */
function getCache(target: object, deep: boolean): object | undefined {
  return deep ? readonlyCache.get(target) : shallowReadonlyCache.get(target)
}

/**
 * 将普通对象的只读代理存入缓存
 * @param target - 目标对象
 * @param proxy - 代理对象
 * @param deep - 是否深度代理
 */
function setCache(target: object, proxy: object, deep: boolean): void {
  deep ? readonlyCache.set(target, proxy) : shallowReadonlyCache.set(target, proxy)
}

/**
 * 从缓存中获取集合类型的只读代理
 * @param target - 目标集合对象
 * @returns 返回缓存的代理对象，不存在则返回 undefined
 */
function getCollectionCache(target: object): object | undefined {
  return collectionReadonlyCache.get(target)
}

/**
 * 将集合类型的只读代理存入缓存
 * @param target - 目标集合对象
 * @param proxy - 代理对象
 */
function setCollectionCache(target: object, proxy: object): void {
  collectionReadonlyCache.set(target, proxy)
}

/**
 * 集合类型枚举
 * 用于标识不同的集合类型，避免重复的 instanceof 检查
 */
const enum CollectionType {
  None,
  Map,
  Set,
  WeakMap,
  WeakSet
}

/**
 * 获取目标对象的集合类型
 * 通过一次 instanceof 检查确定对象是否为集合类型及其具体类型
 * @param target - 要检查的目标对象
 * @returns 返回集合类型枚举值
 */
const getCollectionType = (target: object): CollectionType => {
  if (target instanceof Map) return CollectionType.Map
  if (target instanceof Set) return CollectionType.Set
  if (target instanceof WeakMap) return CollectionType.WeakMap
  if (target instanceof WeakSet) return CollectionType.WeakSet
  return CollectionType.None
}

/**
 * 根据集合类型创建对应的只读代理处理器
 * @param target - 目标集合对象
 * @param type - 集合类型
 * @returns 返回对应的代理处理器
 */
const createCollectionHandler = <T extends AnyMap | AnySet | AnyWeakMap | AnyWeakSet>(
  target: T,
  type: CollectionType
): ProxyHandler<T> => {
  switch (type) {
    case CollectionType.Map:
      return new MapReadonlyHandler(target as AnyMap) as ProxyHandler<T>
    case CollectionType.Set:
      return new SetReadonlyHandler(target as AnySet) as ProxyHandler<T>
    case CollectionType.WeakMap:
      return new WeakMapReadonlyHandler(target as AnyWeakMap) as ProxyHandler<T>
    case CollectionType.WeakSet:
      return new WeakSetReadonlyHandler(target as AnyWeakSet) as ProxyHandler<T>
    default:
      throw new Error(`[Readonly] Unknown collection type: ${type}`)
  }
}

/**
 * 创建集合类型的只读代理对象
 * 内部函数，调用前应已确定目标对象是集合类型
 * @param target - 目标集合对象
 * @param type - 集合类型
 * @returns 返回只读代理对象
 */
function createCollectionReadonlyProxy<T extends AnyMap | AnySet | AnyWeakMap | AnyWeakSet>(
  target: T,
  type: CollectionType
): ReadonlyCollection<T> {
  const cached = getCollectionCache(target)
  if (cached) return cached as unknown as ReadonlyCollection<T>
  const handler = createCollectionHandler(target, type)
  const p = new Proxy(target, handler) as unknown as ReadonlyCollection<T>
  setCollectionCache(target, p)
  return p
}

/**
 * 创建一个只读代理对象
 * 根据目标对象的类型自动选择合适的代理处理器：
 * - 集合类型（Map/Set/WeakMap/WeakSet）使用专门的集合只读处理器
 * - 普通对象使用通用的对象只读处理器
 * @param target - 要代理的目标对象
 * @param deep - 是否深度代理，对集合类型无效
 * @returns - 返回一个只读代理对象
 */
export function createReadonlyProxy<T extends object, IsDeep extends boolean = true>(
  target: T,
  deep: boolean
): ReadonlyObject<T, IsDeep> {
  const collectionType = getCollectionType(target)
  if (collectionType !== CollectionType.None) {
    return createCollectionReadonlyProxy(
      target as unknown as AnyMap | AnySet | AnyWeakMap | AnyWeakSet,
      collectionType
    ) as unknown as ReadonlyObject<T, IsDeep>
  }
  const cached = getCache(target, deep)
  if (cached) return cached as unknown as ReadonlyObject<T, IsDeep>
  const p = new Proxy(target, new ReadonlyProxyHandler<T>(deep)) as unknown as ReadonlyObject<
    T,
    IsDeep
  >
  setCache(target, p, deep)
  return p
}
