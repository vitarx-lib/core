import { isObject } from '@vitarx/utils'
import { IS_RAW_SYMBOL, REF_SYMBOL, SIGNAL_SYMBOL, SIGNAL_VALUE } from '../../constants/index.js'
import { trackSignal, triggerSignal } from '../../depend/index.js'
import type { RefSignal, RefValue } from '../../types/index.js'
import { reactive } from '../reactive/index.js'
import { isSignal, readSignal } from '../utils/index.js'

const toReactive = (val: any) => {
  return isObject(val) && !val[SIGNAL_SYMBOL] && !val[IS_RAW_SYMBOL] ? reactive(val, true) : val
}

/**
 * 响应式引用实现类
 *
 * 包装一个值并使其具有响应性。当值发生变化时，会自动通知依赖它的计算属性和副作用。
 * 支持深层响应式（默认）和浅层响应式。
 *
 * @template T - 引用中存储的值的类型
 * @template Deep - 是否启用深层响应式，默认为 true
 */
export class Ref<T = any, Deep extends boolean = true> implements RefSignal<T, Deep> {
  /** 标识这是一个信号对象 */
  [SIGNAL_SYMBOL]: true = true;

  /** 标识这是一个 Ref 对象 */
  [REF_SYMBOL]: true = true

  /** 是否启用深层响应式 */
  public readonly deep: Deep

  /** 存储原始值 */
  private _rawValue: T

  /**
   * 创建一个新的 Ref 实例
   *
   * @param initialValue - 初始值
   * @param deep - 是否启用深层响应式
   * @throws {Error} 当尝试将一个信号转换为 ref 时抛出错误
   */
  constructor(initialValue: T, deep: Deep) {
    if (isSignal(initialValue)) throw new Error('Cannot convert a signal to a ref')
    this.deep = deep
    this._rawValue = initialValue
    this._value = deep ? toReactive(initialValue) : initialValue
  }

  /** 存储处理后的值（可能被代理） */
  private _value: RefValue<T, Deep>

  /**
   * 获取当前值
   *
   * 访问时会追踪依赖关系，并返回处理后的值
   */
  get value(): RefValue<T, Deep> {
    this.track()
    return readSignal(this._value)
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
    this._value = this.deep ? toReactive(newValue) : newValue
    this._rawValue = newValue
    triggerSignal(this, 'set', { key: 'value', oldValue, newValue })
  }

  /**
   * 获取信号值
   *
   * 访问时会追踪依赖关系
   */
  get [SIGNAL_VALUE]() {
    this.track()
    return this._value
  }

  /**
   * 手动触发依赖更新
   *
   * 当需要强制更新依赖此 ref 的计算属性和副作用时调用
   */
  trigger() {
    triggerSignal(this, 'set', { key: 'value', newValue: this._rawValue })
  }

  /**
   * 手动触发依赖跟踪
   *
   * 外部调用此方法，可强制触发依赖跟踪。
   */
  track() {
    trackSignal(this, 'get', { key: 'value' })
  }

  /**
   * 更新值
   *
   * 等同于 `ref.value = newValue`
   *
   * @param newValue - 新的值
   */
  update = (newValue: T) => {
    this.value = newValue
  }
}
