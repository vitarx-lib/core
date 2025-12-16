import type { AnyRecord } from '@vitarx/utils'
import { isObject } from '@vitarx/utils'
import { removeSignalDeps, trackSignal, triggerSignal } from '../../../../depend/index.js'
import type { Reactive, Signal } from '../../../../types/index.js'
import { IS_SIGNAL, isSignal, readSignal, SIGNAL_VALUE } from '../../../core/index.js'
import { isMakeRaw } from '../helpers.js'
import { ReactiveSignal } from './base.js'
import { MapProxy, WeakMapProxy } from './map.js'
import { SetProxy, WeakSetProxy } from './set.js'

/**
 * 检查一个值是否为嵌套对象
 * 嵌套对象是指普通的JavaScript对象，不是信号(Signal)也不是非信号标记(MarkNonSignal)
 *
 * @param value - 需要检查的值
 * @returns {boolean} 如果值是嵌套对象则返回true，否则返回false
 *          使用类型谓词(value is object)来确保返回true时value的类型为object
 */
function isNestingObject(value: any): value is object {
  return isObject(value) && !isMakeRaw(value)
}

/**
 * ChildSignal 类是一个实现 Signal 接口的泛型类
 * 它用于跟踪和响应对象属性的变化
 * @template T - 目标对象的类型，必须是一个对象类型
 * @template K - 目标对象键的类型，必须是 T 的键之一
 */
export class ChildSignal<T extends object, K extends keyof T> implements Signal<T[K]> {
  // 只读属性，用于标识这是一个信号对象
  readonly [IS_SIGNAL] = true
  // 私有属性，用于存储代理对象，用于嵌套对象的响应式处理
  private proxy?: Reactive
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
  get [SIGNAL_VALUE]() {
    // 访问值时追踪信号依赖，用于建立依赖关系
    trackSignal(this)
    // 如果已存在代理对象，直接返回
    if (this.proxy) return this.proxy
    // 获取当前值
    const value = this.target[this.key]
    if (isSignal(value)) return readSignal(value)
    // 如果值是嵌套对象，创建代理对象
    if (this.deep && isNestingObject(value)) {
      return (this.proxy = createProxyObject(value))
    }
    // 返回当前值
    return value
  }
  // 设置信号值的setter
  set [SIGNAL_VALUE](v: any) {
    // 保存旧值以便后续比较
    const oldValue = this.target[this.key]
    // 使用Object.is比较新旧值，避免不必要的更新
    if (Object.is(oldValue, v)) return
    // 更新为新值
    this.target[this.key] = v
    // 移除代理，因为值可能已经改变
    this.proxy = undefined
    // 触发信号更新通知，传入新值和旧值
    triggerSignal(this, 'set', { newValue: v, oldValue })
  }
  /**
   * 使信号失效，触发更新通知
   * 通常在对象属性被删除或重置时调用
   */
  invalidate(oldValue: any) {
    // 移除代理
    this.proxy = undefined
    // 触发信号更新通知，传入旧值和undefined作为新值
    triggerSignal(this, 'set', { oldValue: oldValue, newValue: undefined })
    // 移除信号依赖链
    removeSignalDeps(this)
  }
}

export class ObjectProxy<T extends AnyRecord, Deep extends boolean = true> extends ReactiveSignal<
  T,
  Deep
> {
  /**
   * 子代理映射表，存储对象属性的子信号
   */
  protected readonly childMap = new Map<any, ChildSignal<T, any>>()
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
    const hadOwn = Object.prototype.hasOwnProperty.call(target, p)
    // 保存删除前的属性值
    const oldValue = target[p]
    // 使用Reflect执行删除操作
    const result = Reflect.deleteProperty(target, p)
    // 仅删除自身属性才触发结构 signal
    if (hadOwn && result) {
      this.triggerSignal('deleteProperty', { key: p, oldValue, newValue: undefined })
      // 如果有 child signal，失效
      const sig = this.childMap.get(p)
      if (sig) {
        this.childMap.delete(p)
        sig.invalidate(oldValue)
      }
    }
    return result
  }
  protected doGet(target: T, p: keyof T, receiver: any) {
    let value: any // 用于存储获取到的属性值
    // 检查目标对象是否自身拥有该属性
    if (!Object.prototype.hasOwnProperty.call(target, p)) {
      value = Reflect.get(target, p, receiver) // 使用Reflect获取属性值
      if (value === void 0) {
        // 如果值为undefined
        this.trackSignal('has', { key: p }) // 跟踪信号
      }
      return value // 返回获取的值
    }
    // 检查子映射中是否已存在该属性的信号
    if (this.childMap.has(p)) return this.childMap.get(p)![SIGNAL_VALUE]
    // 如果不存在，则创建一个新的子信号
    const sig = new ChildSignal(target, p, this.deep)
    this.childMap.set(p, sig) // 将新信号添加到子映射中
    return sig[SIGNAL_VALUE] // 返回信号中的值
  }
  protected set(target: T, p: keyof T, newValue: any, receiver: any): boolean {
    // 已有 ChildSignal：必须走信号（它维护 proxy / 嵌套 reactive）
    const sig = this.childMap.get(p) // 获取属性对应的信号
    if (sig) {
      // 如果存在信号
      sig[SIGNAL_VALUE] = newValue // 直接更新信号的值
      return true // 设置成功
    }
    // 检查属性是否已存在
    const hadKey = Object.prototype.hasOwnProperty.call(target, p)
    // 没有 ChildSignal：直接结构写入
    const result = Reflect.set(target, p, newValue, receiver) // 使用Reflect设置属性值
    if (!result) return false // 如果设置失败则返回false
    // 只触发结构变化信号，不创建子信号
    if (!hadKey) this.triggerSignal('add', { key: p, oldValue: undefined, newValue }) // 如果是新属性，触发添加信号的回调
    return true // 设置成功返回true
  }
}

export class ArrayProxy<T extends any[], Deep extends boolean = true> extends ObjectProxy<T, Deep> {
  // 存储数组旧长度的私有属性
  private oldLength: number
  // 存储数组长度特殊子信号的只读属性
  private readonly lengthSignal: ChildSignal<T, 'length'>
  /**
   * 构造函数
   * @param target - 目标数组
   * @param deep - 是否深度代理
   */
  constructor(target: T, deep?: Deep) {
    super(target, deep)
    // 初始化旧长度为当前数组长度
    this.oldLength = target.length
    // 与构建长度特殊子信号
    this.lengthSignal = new ChildSignal(target, 'length', false)
    this.childMap.set('length', this.lengthSignal)
  }
  protected override set(target: T, p: keyof T, newValue: any, receiver: any): boolean {
    if (p === 'length') {
      if (typeof newValue !== 'number' || newValue < 0 || !Number.isInteger(newValue)) {
        throw new TypeError(`Invalid array length: ${newValue}`)
      }
      const oldValue = this.oldLength
      if (newValue === oldValue) return true
      target.length = newValue
      for (let i = newValue; i < oldValue; i++) {
        const sig = this.childMap.get(i)
        if (sig) {
          sig.invalidate(undefined) // 解绑依赖
          this.childMap.delete(i)
        }
      }
      this.oldLength = newValue
      // 触发长度更新通知，必须主动触发，不能通过修改子信号值触发，因为子信号会判断值是否一致
      triggerSignal(this.lengthSignal, 'set', { oldValue, newValue })
      // 触发代理对象 结构变化信号
      this.triggerSignal('add', { key: p, oldValue, newValue })
      return true
    }
    return super.set(target, p, newValue, receiver)
  }
}

/**
 *
 * @param target
 * @param deep
 */
export function createProxyObject<T extends object, Deep extends boolean = true>(
  target: T,
  deep?: Deep
): Reactive<T, Deep> {
  if (Array.isArray(target)) {
    return new ArrayProxy(target, deep).proxy
  }
  // 如果传入的是Map类型，则使用MapProxyHandler创建代理
  if (target instanceof Map) {
    return new MapProxy(target).proxy as any
  }
  // 如果传入的是Set类型，则使用SetProxyHandler创建代理
  if (target instanceof Set) {
    return new SetProxy(target).proxy as any
  }
  // 如果传入的是WeakSet类型，则使用WeakSetProxyHandler创建代理
  if (target instanceof WeakSet) {
    return new WeakSetProxy(target).proxy as any
  }
  // 如果传入的是WeakMap类型，则使用WeakMapProxyHandler创建代理
  if (target instanceof WeakMap) {
    return new WeakMapProxy(target).proxy as any
  }
  return new ObjectProxy(target, deep).proxy
}
