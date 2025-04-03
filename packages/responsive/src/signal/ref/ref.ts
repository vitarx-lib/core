import { isObject } from '@vitarx/utils'
import { Depend } from '../../depend/index'
import { Observer } from '../../observer/index'
import { DEEP_SIGNAL_SYMBOL, SIGNAL_SYMBOL, VALUE_SIGNAL_SYMBOL } from '../constants'
import { SignalManager } from '../manager'
import { reactive } from '../reactive/index'
import type { BaseSignal, RefSignal, RefValue, SignalOptions } from '../types'
import { isMarkNotSignal } from '../utils'

/**
 * # `Ref`值代理对象，用于代理一个值，使其成为响应式变量。
 *
 * @template T - 任意类型
 * @template Deep - 是否深度代理
 * @remarks
 * 该对象的`value`属性是响应式的，当其值发生变化时，会触发监听器的回调函数。
 *
 * @example
 * ```ts
 * const count = new Ref(0) // 或使用助手函数 ref(0)
 * count.value++ // count.value 的值变为1
 * ```
 */
export class Ref<T = any, Deep extends boolean = true> implements RefSignal<T, Deep> {
  // 标识为代理对象
  readonly [SIGNAL_SYMBOL] = true
  // 标识为值代理对象
  readonly [VALUE_SIGNAL_SYMBOL] = true
  /**
   * 配置选项
   *
   * @private
   */
  private readonly options: Required<SignalOptions<Deep>>
  private _childSignal?: RefValue<T, Deep>
  private _needProxy: boolean = false

  /**
   * 创建Ref值信号对象
   *
   * @param value
   * @param {SignalOptions} [options] - 代理配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理
   * @param {EqualityFn} [options.equalityFn=Object.is] - 值比较函数
   */
  constructor(value: T, options?: SignalOptions<Deep>) {
    this.options = {
      equalityFn: options?.equalityFn ?? Object.is,
      deep: options?.deep ?? (true as Deep)
    }
    this._value = value
    this._needProxy = this.isNeedProxy()
  }

  /**
   * 引用的值
   *
   * @private
   */
  private _value: T

  /** 获取目标变量 */
  get value(): RefValue<T, Deep> {
    if (this._childSignal) {
      return this._childSignal
    } else if (this._needProxy) {
      this._childSignal = reactive(this._value as AnyObject, this.options) as RefValue<T, Deep>
      SignalManager.addParent(this._childSignal as BaseSignal, this, 'value')
      this._needProxy = false
      return this._childSignal
    }
    Depend.track(this, 'value')
    return this._value as RefValue<T, Deep>
  }

  /** 修改目标变量 */
  set value(newValue: T) {
    if (this.options.equalityFn(this._value, newValue)) return
    // 删除子代理
    if (this._childSignal) {
      SignalManager.removeParent(this._childSignal as unknown as BaseSignal, this, 'value')
      this._childSignal = undefined
    }
    this._needProxy = this.isNeedProxy()
    this._value = newValue
    this.trigger()
  }

  /**
   * 是否深度代理
   */
  get deep() {
    return this.options.deep
  }

  /**
   * 是否深度代理标识
   */
  get [DEEP_SIGNAL_SYMBOL](): Deep {
    return this.deep
  }

  /**
   * 定义当对象需要转换成原始值时的行为
   * @param hint
   */
  [Symbol.toPrimitive](hint: any) {
    switch (hint) {
      case 'number':
        return this.value
      case 'string':
        return this.toString()
      case 'default':
        return this.value
    }
  }

  /**
   * 手动触发更新事件
   *
   * @private
   */
  trigger() {
    Observer.notify(this, 'value')
    const parentMap = SignalManager.getParents(this)
    if (!parentMap) return
    // 通知父级
    for (const [parent, keys] of parentMap) {
      Observer.notify(parent, Array.from(keys) as any)
    }
  }

  /**
   * 将引用的目标值转换为字符串
   *
   * 如果目标值有`toString`方法，则会返回目标值的字符串形式，否则返回[Object Ref<`typeof target`>]。
   *
   * @override
   */
  toString() {
    if (this._value?.toString) {
      return this._value.toString()
    } else {
      return `[Object Ref<${typeof this._value}>]`
    }
  }

  /**
   * 判断是否需要代理
   *
   * @private
   */
  private isNeedProxy() {
    return this.options.deep && isObject(this._value) && !isMarkNotSignal(this._value)
  }
}
