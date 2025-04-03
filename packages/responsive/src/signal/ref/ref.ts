import { isObject } from '@vitarx/utils'
import { Depend } from '../../depend/index'
import { Observer } from '../../observer/index'
import { DEEP_SIGNAL_SYMBOL, REF_SIGNAL_SYMBOL, SIGNAL_SYMBOL } from '../constants'
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
  /**
   * 标识为响应式信号对象
   * @readonly
   */
  readonly [SIGNAL_SYMBOL] = true

  /**
   * 标识为值引用类型的响应式信号
   * @readonly
   */
  readonly [REF_SIGNAL_SYMBOL] = true

  /**
   * 响应式配置选项
   * @private
   */
  private readonly _options: Required<SignalOptions<Deep>>

  /**
   * 标识当前值是否需要被代理为响应式对象
   * @private
   */
  private _shouldProxyValue: boolean = false

  /**
   * 存储被代理后的子响应式对象
   * @private
   */
  private _reactiveValue?: RefValue<T, Deep>

  /**
   * 创建Ref值信号对象
   *
   * @param {T} value - 需要被包装为响应式的值
   * @param {SignalOptions} [options] - 响应式配置选项
   * @param {boolean} [options.deep=true] - 是否深度代理嵌套对象
   * @param {EqualityFn} [options.equalityFn=Object.is] - 值比较函数，用于决定是否触发更新
   */
  constructor(value: T, options?: SignalOptions<Deep>) {
    this._options = {
      equalityFn: options?.equalityFn ?? Object.is,
      deep: options?.deep ?? (true as Deep)
    }
    this._value = value
    this.evaluateProxyNeeded()
  }

  /**
   * 存储原始值的内部属性
   *
   * @private
   */
  private _value: T

  /**
   * 获取响应式值
   *
   * 根据配置和值类型，可能返回原始值或响应式代理对象：
   * - 如果已存在响应式代理对象，则直接返回
   * - 如果需要代理且尚未创建代理，则创建新的响应式代理
   * - 否则返回原始值并追踪依赖
   *
   * @returns {RefValue<T, Deep>} 响应式值或原始值
   */
  get value(): RefValue<T, Deep> {
    if (this._reactiveValue) {
      return this._reactiveValue
    } else if (this._shouldProxyValue) {
      this._reactiveValue = reactive(this._value as AnyObject, this._options) as RefValue<T, Deep>
      SignalManager.addParent(this._reactiveValue as BaseSignal, this, 'value')
      this._shouldProxyValue = false
      return this._reactiveValue
    }
    Depend.track(this, 'value')
    return this._value as RefValue<T, Deep>
  }

  /**
   * 设置新值并触发更新
   *
   * 当新值与旧值不同时：
   * - 清理旧的响应式代理（如果存在）
   * - 更新内部值
   * - 重新评估是否需要代理
   * - 通知观察者和父级信号
   *
   * @param {T} newValue - 要设置的新值
   */
  set value(newValue: T) {
    if (this._options.equalityFn(this._value, newValue)) return
    // 清理旧的响应式代理
    if (this._reactiveValue) {
      SignalManager.removeParent(this._reactiveValue as unknown as BaseSignal, this, 'value')
      this._reactiveValue = undefined
    }
    this._value = newValue
    this.evaluateProxyNeeded()
    Observer.notify(this, 'value')
    SignalManager.notifyParent(this)
  }

  /**
   * 是否深度代理标识
   *
   * @returns {Deep} 当前实例的深度代理配置
   */
  get [DEEP_SIGNAL_SYMBOL](): Deep {
    return this._options.deep
  }

  /**
   * 定义当对象需要转换成原始值时的行为
   *
   * 根据不同的转换提示返回适当的值：
   * - 'number': 返回值本身，尝试进行数值转换
   * - 'string': 调用toString方法
   * - 'default': 返回值本身
   *
   * @param {string} hint - 转换提示类型
   * @returns {any} 根据提示类型转换后的原始值
   */
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

  /**
   * 将引用的目标值转换为字符串
   *
   * 如果目标值有`toString`方法，则会返回目标值的字符串形式，
   * 否则返回格式化的类型描述。
   *
   * @returns {string} 字符串表示
   * @override
   */
  toString(): string {
    if (this._value?.toString) {
      return this._value.toString()
    } else {
      return `[Object Ref<${typeof this._value}>]`
    }
  }

  /**
   * 重新评估当前值是否需要代理
   *
   * 根据以下条件决定是否需要将value转换为响应式对象：
   * - deep配置为true（启用深度响应）
   * - 当前值是对象类型
   * - 当前值未被标记为非响应式对象
   *
   * @private
   */
  private evaluateProxyNeeded() {
    this._shouldProxyValue =
      this._options.deep && isObject(this._value) && !isMarkNotSignal(this._value)
  }
}
