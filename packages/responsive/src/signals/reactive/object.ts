import type { AnyRecord } from '@vitarx/utils'
import { hasOwnProperty, isObject } from '@vitarx/utils'
import { clearSignalLinks, trackSignal, triggerSignal } from '../../core/index.js'
import { IS_RAW, isRef } from '../shared/index.js'
import { ReactiveSource } from './base.js'
import { MapReactive, WeakMapReactive } from './map.js'
import { SetReactive, WeakSetReactive } from './set.js'

/**
 * 检查一个值是否为嵌套对象
 * 嵌套对象是指普通的JavaScript对象，不是非信号标记(IS_MARK_RAW)
 *
 * @param value - 需要检查的值
 * @returns {boolean} 如果值是嵌套对象则返回true，否则返回false
 *          使用类型谓词(value is object)来确保返回true时value的类型为object
 */
const isNestingObject = (value: any): value is object => {
  return isObject(value) && !value[IS_RAW]
}
/**
 * 设置对象属性的值
 *
 * @param target - 目标对象
 * @param key - 属性键
 * @param value - 新的属性值
 */
const setValue = <T extends object>(target: T, key: keyof T, value: any): boolean => {
  const oldValue = target[key]
  if (isRef(oldValue)) {
    oldValue.value = value
    return true
  }
  // 使用Object.is比较新旧值，避免不必要的更新
  if (Object.is(oldValue, value)) return false
  // 更新为新值
  target[key] = value
  return true
}
/**
 * ReactiveProperty 类用于跟踪和响应对象属性的变化，仅在reactive内部使用
 *
 * 用于包装对象的单个属性，使其具有响应式能力。
 * 当属性被访问时会建立依赖关系，当属性被修改时会触发更新通知。
 *
 * @template T - 目标对象的类型，必须是一个对象类型
 * @template K - 目标对象键的类型，必须是 T 的键之一
 */
export class ReactiveProperty<T extends object, K extends keyof T> {
  // 私有属性，用于存储代理对象，用于嵌套对象的响应式处理
  private proxy?: T[K]
  /**
   * 构造函数
   * @param target - 目标对象
   * @param key - 目标对象的键
   * @param deep - 是否进行深度代理
   */
  constructor(
    public readonly target: T,
    public readonly key: K,
    public readonly deep: boolean
  ) {}
  // 获取信号值的getter
  getValue(): any {
    // 访问值时追踪信号依赖，用于建立依赖关系
    trackSignal(this)
    // 如果已存在代理对象，直接返回
    if (this.proxy) return this.proxy
    // 获取当前值
    const value = this.target[this.key]
    // 解包 ref
    if (isRef(value)) return value.value
    // 如果值是嵌套对象，创建代理对象
    if (this.deep && isNestingObject(value)) {
      return (this.proxy = createReactive(value, true))
    }
    // 返回当前值
    return value
  }
  setValue(v: any) {
    // 设置属性值，并返回代理对象
    const result = setValue(this.target, this.key, v)
    if (result) {
      this.proxy = undefined
      triggerSignal(this, 'set', { newValue: v })
    }
  }
  /**
   * 使信号失效，触发更新通知
   * 通常在对象属性被删除或重置时调用
   *
   * @param oldValue - 属性的旧值
   */
  invalidate(oldValue: any) {
    // 移除代理
    this.proxy = undefined
    // 触发信号更新通知，传入旧值和undefined作为新值
    triggerSignal(this, 'set', { oldValue: oldValue, newValue: undefined })
    // 移除信号依赖链
    clearSignalLinks(this)
  }
}
/**
 * ObjectReactive 类用于创建对象的响应式代理
 *
 * 该类继承自 ReactiveSource，提供了对普通对象的代理处理。
 * 它通过 ReactiveProperty 来管理对象各个属性的响应式行为。
 *
 * @template T - 目标对象的类型，必须是 键值对对象 类型
 */
export class ObjectReactive<T extends AnyRecord> extends ReactiveSource<T> {
  /**
   * 属性映射表，存储对象属性的子信号
   *
   * 该 Map 用于缓存对象属性对应的 ReactiveProperty 实例，
   * 避免重复创建相同的信号实例。
   */
  protected readonly propertyMap = new Map<keyof any, ReactiveProperty<T, any>>()
  /**
   * 检查目标对象是否包含指定的属性
   * @param target 目标对象
   * @param p 属性键，可以是字符串或Symbol类型
   * @returns {boolean} 如果目标对象包含指定属性则返回true，否则返回false
   */
  has(target: T, p: string | symbol): boolean {
    // 跟踪信号，记录has操作和相关的键
    this.trackSignal('has', { key: p })
    // 使用Reflect.has检查目标对象是否包含指定属性并返回结果
    return Reflect.has(target, p)
  }
  /**
   * 删除对象属性的代理处理方法
   * @param target 目标对象
   * @param p 要删除的属性键，可以是字符串或Symbol
   * @returns {boolean} 返回一个布尔值，表示删除操作是否成功
   */
  deleteProperty(target: T, p: string | symbol): boolean {
    // 检查目标对象是否拥有该属性
    const hadOwn = hasOwnProperty(target, p)
    // 保存删除前的属性值
    const oldValue = target[p]
    // 使用Reflect执行删除操作
    const result = Reflect.deleteProperty(target, p)
    // 仅删除自身属性才触发结构 signal
    if (hadOwn && result) {
      // 如果有 child signal，失效
      const sig = this.propertyMap.get(p)
      if (sig) {
        this.propertyMap.delete(p)
        sig.invalidate(oldValue)
      }
      this.triggerSignal('deleteProperty', { key: p, oldValue, newValue: undefined })
    }
    return result
  }
  /**
   * 获取对象属性值的处理方法
   *
   * 该方法负责处理对象属性的读取操作，会根据情况返回属性值或对应的信号。
   * 如果属性已有对应的 PropertySignal，则返回该信号的值；
   * 否则创建新的 PropertySignal 并返回其值。
   *
   * @param target - 目标对象
   * @param p - 属性键
   * @param receiver - 代理对象
   * @returns 返回属性值或信号值
   */
  protected doGet(target: T, p: string | symbol, receiver: any) {
    let value: any // 用于存储获取到的属性值
    // 检查目标对象是否自身拥有该属性
    if (!hasOwnProperty(target, p)) {
      value = Reflect.get(target, p, receiver) // 使用Reflect获取属性值
      if (value === void 0) {
        // 如果值为undefined
        this.trackSignal('has', { key: p }) // 跟踪信号
      }
      return value // 返回获取的值
    }
    const childSig = this.propertyMap.get(p)
    // 检查子映射中是否已存在该属性的信号
    if (childSig) return childSig.getValue()
    // 如果不存在，则创建一个新的子信号
    const sig = new ReactiveProperty(target, p, this.deep)
    this.propertyMap.set(p, sig) // 将新信号添加到子映射中
    return sig.getValue() // 返回信号中的值
  }
  /**
   * 设置对象属性值的处理方法
   *
   * 该方法负责处理对象属性的写入操作。
   * 如果属性已有对应的 PropertySignal，则通过信号来更新值；
   * 否则直接设置属性值并根据需要触发相应的信号。
   *
   * @param target - 目标对象
   * @param p - 属性键
   * @param newValue - 新的属性值
   * @param _receiver - 代理对象
   * @returns {boolean} 返回设置操作是否成功
   */
  protected set(target: T, p: string | symbol, newValue: any, _receiver: any): boolean {
    // 已有 PropertySignal：必须走信号（它维护 proxy / 嵌套 reactive）
    const sig = this.propertyMap.get(p) // 获取属性对应的信号
    if (sig) {
      // 如果存在属性信号,则更新
      sig.setValue(newValue)
      return true // 设置成功
    }
    // 检查属性是否已存在
    const hadKey = hasOwnProperty(target, p as string)
    // 更新属性值
    setValue(target, p, newValue)
    // 如果是新属性，触发添加信号的回调
    if (!hadKey) this.triggerSignal('set', { key: p, oldValue: undefined, newValue })
    return true // 设置成功返回true
  }
}
/**
 * ArrayReactive 类用于创建数组的响应式代理
 *
 * 该类继承自 ObjectReactive，专门处理数组类型的响应式代理。
 * 它增加了对数组长度属性的特殊处理，确保数组长度变化也能正确触发响应。
 *
 * @template T - 目标数组的类型，必须是 any[] 类型
 */
export class ArrayReactive<T extends any[]> extends ObjectReactive<T> {
  // 存储数组旧长度的私有属性
  private oldLength: number
  // 存储数组长度特殊子信号的只读属性
  private readonly lengthSignal: ReactiveProperty<T, 'length'>
  /**
   * 构造函数
   * @param target - 目标数组
   * @param deep - 是否深度代理
   */
  constructor(target: T, deep: boolean) {
    super(target, deep)
    // 初始化旧长度为当前数组长度
    this.oldLength = target.length
    // 与构建长度特殊子信号
    this.lengthSignal = new ReactiveProperty(target, 'length', false)
    this.propertyMap.set('length', this.lengthSignal)
  }
  /**
   * 重写的设置属性值方法，专门处理数组长度的变化
   *
   * 当设置数组的 length 属性时，该方法会确保正确处理数组长度变化，
   * 包括清理被截断元素的依赖关系和触发相应的更新信号。
   *
   * @param target - 目标数组
   * @param p - 属性键
   * @param newValue - 新的属性值
   * @param receiver - 代理对象
   * @returns {boolean} 返回设置操作是否成功
   */
  protected override set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
    if (p === 'length') {
      if (typeof newValue !== 'number' || newValue < 0 || !Number.isInteger(newValue)) {
        throw new TypeError(`Invalid array length: ${newValue}`)
      }
      const oldValue = this.oldLength
      if (newValue === oldValue) return true
      target.length = newValue

      // 优化：使用迭代器一次性处理所有需要失效的元素
      // 遍历并失效被截断的元素信号
      for (let i = newValue; i < oldValue; i++) {
        const sig = this.propertyMap.get(i)
        if (sig) {
          sig.invalidate(undefined) // 解绑依赖
          this.propertyMap.delete(i)
        }
      }

      this.oldLength = newValue
      // 触发长度更新通知，必须主动触发，不能通过修改子信号值触发，因为子信号会判断值是否一致
      triggerSignal(this.lengthSignal, 'set', { oldValue, newValue })
      // 触发代理对象 结构变化信号
      this.triggerSignal('set', { key: p, oldValue, newValue })
      return true
    }
    return super.set(target, p, newValue, receiver)
  }
}

/**
 * 响应式对象缓存，用于存储已创建的响应式代理对象
 *
 * 使用 WeakMap 来避免内存泄漏，确保当原始对象被垃圾回收时，
 * 对应的代理对象也能被正确回收。
 */
const reactiveCache = new WeakMap<object, ReactiveSource<any>>()
const shallowReactiveCache = new WeakMap<object, ReactiveSource<any>>()
const getCache = <T extends object>(target: T, deep: boolean) =>
  deep ? reactiveCache.get(target)?.proxy : shallowReactiveCache.get(target)?.proxy
const setCache = (instance: ReactiveSource<any>) => {
  instance.deep
    ? reactiveCache.set(instance.target, instance)
    : shallowReactiveCache.set(instance.target, instance)
  return instance.proxy
}

/**
 * 创建对象的响应式代理
 *
 * 该函数根据目标对象的类型创建相应的响应式代理：
 * - 数组使用 ArrayReactive
 * - Map 使用 MapReactive
 * - Set 使用 SetReactive
 * - WeakSet 使用 WeakSetReactive
 * - WeakMap 使用 WeakMapReactive
 * - 普通对象使用 ObjectReactive
 *
 * 同时使用缓存机制避免重复创建相同的代理对象。
 *
 * @template T - 目标对象的类型
 * @template Deep - 是否进行深度代理
 * @param target - 需要创建代理的目标对象
 * @param deep - 是否进行深度代理，默认为 true
 * @returns 返回目标对象的响应式代理
 */
export function createReactive<T extends object, Deep extends boolean>(target: T, deep: Deep): T {
  if (Array.isArray(target)) {
    return getCache(target, deep) ?? setCache(new ArrayReactive(target, deep))
  }
  // 如果传入的是Map类型，则使用MapProxyHandler创建代理
  if (target instanceof Map) {
    return getCache(target, false) ?? setCache(new MapReactive(target))
  }
  // 如果传入的是Set类型，则使用SetProxyHandler创建代理
  if (target instanceof Set) {
    return getCache(target, false) ?? setCache(new SetReactive(target))
  }
  // 如果传入的是WeakSet类型，则使用WeakSetProxyHandler创建代理
  if (target instanceof WeakSet) {
    return getCache(target, false) ?? setCache(new WeakSetReactive(target))
  }
  // 如果传入的是WeakMap类型，则使用WeakMapProxyHandler创建代理
  if (target instanceof WeakMap) {
    return getCache(target, false) ?? setCache(new WeakMapReactive(target))
  }
  return getCache(target, deep) ?? setCache(new ObjectReactive(target, deep))
}
