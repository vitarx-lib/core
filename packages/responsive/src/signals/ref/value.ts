import { type AnyFunction, type AnyObject, isFunction, isObject, logger } from '@vitarx/utils'
import { trackSignal, triggerSignal } from '../../core/index.js'
import type { Reactive } from '../reactive/base.js'
import { reactive } from '../reactive/index.js'
import { IS_RAW, IS_REACTIVE, IS_REF, IS_SIGNAL, isRef, type RefSignal } from '../shared/index.js'

export type ToRefValue<T> = T extends AnyFunction ? T : T extends AnyObject ? Reactive<T> : T

const toReactive = (val: any) => {
  return isObject(val) && !val[IS_REACTIVE] && !val[IS_SIGNAL] && !val[IS_RAW] ? reactive(val) : val
}

/**
 * ValueRef 类是一个通用的引用类，实现了 Signal 和 Ref 接口
 * 它可以存储和响应式地管理任意类型的值
 *
 * @template T - 存储值的类型，默认为 any
 */
export class ValueRef<T = any> implements RefSignal<ToRefValue<T>, T> {
  /** 标识这是一个信号对象 */
  readonly [IS_SIGNAL]: true = true
  /** 标识这是一个 Ref 对象 */
  readonly [IS_REF]: true = true
  /** 存储原始值 */
  private _rawValue: T
  /**
   * 创建一个新的 Ref 实例
   *
   * @param initialValue - 初始值
   * @throws {Error} 当尝试将一个信号转换为 ref 时抛出错误
   */
  constructor(initialValue: T) {
    if (__VITARX_DEV__) {
      if (isRef(initialValue)) {
        logger.warn(
          '[Ref] Creating a ref from another ref is not recommended as it creates unnecessary nesting. Consider using the original ref directly.'
        )
      }
    }
    this._rawValue = initialValue
    this._value = toReactive(initialValue)
  }
  /** 存储处理后的值（可能被代理） */
  private _value: ToRefValue<T>
  /**
   * 获取当前值
   *
   * 访问时会追踪依赖关系，并返回处理后的值
   */
  get value(): ToRefValue<T> {
    trackSignal(this, 'get', { key: 'value' })
    return this._value
  }
  /**
   * 设置新值
   *
   * 如果新值与旧值相同则不执行任何操作。
   * 否则更新值并触发依赖更新。
   *
   * @param newValue - 新的值
   */
  set value(newValue: T) {
    if (Object.is(this._rawValue, newValue)) return
    const oldValue = this._rawValue
    this._value = toReactive(newValue)
    this._rawValue = newValue
    triggerSignal(this, 'set', { key: 'value', oldValue, newValue })
  }
  /** 偷偷读取value - 不触发跟踪！*/
  get peek(): ToRefValue<T> {
    return this._value
  }
  /** 读取原始值 - 不触发跟踪！*/
  get raw(): T {
    return this._rawValue
  }
  toString(): string {
    const val = this.value
    if (val?.toString && isFunction(val.toString)) {
      return val.toString()
    }
    return `[Object Ref<${typeof val}>]`
  }
  [Symbol.toPrimitive](hint: string): any {
    switch (hint) {
      case 'number':
        return this.value
      case 'string':
        return this.toString()
      case 'default':
        return this.value
    }
  }
}
