import { isFunction, logger } from '@vitarx/utils'
import { IS_SIGNAL, SIGNAL_VALUE } from '../../constants/index.js'
import { collectSignal, trackSignal, triggerSignal } from '../../depend/index.js'
import { Effect, type EffectOptions, EffectScope } from '../../effect/index.js'
import type { DepEffect, Signal } from '../../types/index.js'

/**
 * 计算属性的值获取函数
 *
 * @template T - 计算结果值的类型
 * @param {T | undefined} oldValue - 上一次的计算结果，第一次计算时为undefined
 * @returns {T} - 计算结果
 */
export type ComputedGetter<T> = (oldValue: T | undefined) => T
/**
 * 计算属性的setter处理函数
 *
 * @template T - 同计算结果的类型
 */
export type ComputedSetter<T> = (newValue: T) => void

/**
 * 计算属性的选项
 *
 * @template T - 计算结果的类型
 */
export interface ComputedOptions<T> extends EffectOptions {
  /**
   * 计算属性的setter处理函数
   *
   * 计算属性一般是不允许修改的，如果你需要处理修改计算属性值，可以传入setter参数，
   *
   * setter参数是一个函数，接受一个参数，就是新的值，你可以在这里进行一些操作，比如修改依赖的值，但是不能修改计算属性的值。
   *
   * @example
   *
   * ```ts
   * const count = ref(0)
   * const double = computed(() => count.value * 2, {
   *   setter: (newValue) => {
   *     count.value = newValue / 2
   *   }
   * })
   * double.value = 10
   * console.log(double.value) // 5
   * ```
   *
   * @param newValue - 新的值
   */
  setter?: ComputedSetter<T>
  /**
   * 立即计算
   *
   * 如果设置为true，则在创建时立即执行getter并计算结果。
   * 默认为false，采用Vue的懒计算模式，在第一次访问value时才进行计算。
   *
   * @default false
   */
  immediate?: boolean
}

/**
 * # 计算属性
 *
 * 计算属性是一种特殊的响应式数据，它的值由一个getter函数计算得出。
 * 当依赖的响应式数据发生变化时，计算属性会自动重新计算并更新其值。
 *
 * @template T - 计算结果的类型
 * @implements {RefSignal<T>} - 实现RefSignal接口，使其可以像普通的响应式引用一样使用
 *
 * @example
 * ```ts
 * const count = ref(0)
 * const double = new Computed(() => count.value * 2)
 * console.log(double.value) // 0
 * count.value = 2
 * console.log(double.value) // 4
 * ```
 */
export class Computed<T> extends Effect implements Signal<T>, DepEffect {
  readonly [IS_SIGNAL]: true = true
  /**
   * 脏标记，标识是否需要重新计算
   * true表示依赖已变化，需要重新计算
   * @private
   */
  private _dirty: boolean = true
  /**
   * 计算属性的getter函数
   * @private
   */
  private readonly _getter: ComputedGetter<T>
  /**
   * 计算属性的setter函数
   * @private
   */
  private readonly _setter?: ComputedSetter<T>
  /**
   * 是否已设置副作用
   * @private
   */
  private _isSetup: boolean = false

  /**
   * 构造一个计算属性对象
   *
   * @param {ComputedGetter<T>} getter - 计算属性的getter函数，接收上一次的计算结果作为参数
   * @param {ComputedOptions<T>} [options={}] - 计算属性的配置选项
   * @param {ComputedSetter<T>} [options.setter] - 计算属性的setter函数，用于处理对计算属性的赋值操作
   * @param {boolean} [options.immediate=false] - 是否立即计算，默认为false，采用懒计算模式
   * @param {boolean | EffectScope} [options.scope=true] - 是否添加到当前作用域，默认为true，作用域销毁时自动清理
   */
  constructor(getter: ComputedGetter<T>, options: ComputedOptions<T> = {}) {
    // 处理作用域
    const { immediate = false, setter, ...effectOptions } = options
    super(effectOptions)
    this._getter = getter
    this._setter = options.setter
    // 立即计算
    if (immediate) this.recomputed()
  }

  get [SIGNAL_VALUE](): T {
    return this.value
  }

  /**
   * 计算结果缓存
   * @private
   */
  private _value: T = undefined as T

  /**
   * 获取计算结果
   *
   * 采用Vue的懒计算策略：
   * 1. 首次访问时设置副作用并计算
   * 2. 后续访问时，仅当dirty为true时才重新计算
   * 3. 追踪对value的访问，建立依赖关系
   *
   * @returns {T} 计算结果
   */
  get value(): T {
    // 首次访问或手动调用后，设置副作用
    if (!this._isSetup || this._dirty) this.recomputed()
    // 追踪对value属性的访问
    trackSignal(this, 'get', { key: 'value' })
    return this._value
  }

  /**
   * 修改计算结果
   *
   * 如果提供了setter函数，则调用setter函数处理新值；
   * 否则，输出警告信息，提示计算属性不应该被直接修改。
   *
   * @param {T} newValue - 要设置的新值
   */
  set value(newValue: T) {
    if (this._setter) {
      this._setter(newValue)
    } else {
      logger.warn(
        'Computed properties should not be modified directly unless a setter function is defined.'
      )
    }
  }

  schedule() {
    if (this._dirty) {
      this._dirty = true
      triggerSignal(this, 'dirty')
    }
  }

  /**
   * 将计算属性转换为字符串
   *
   * @returns {string} 字符串表示
   */
  override toString(): string {
    const val = this.value
    if (val?.toString && isFunction(val.toString)) {
      return val.toString()
    }
    return `[Object Computed<${typeof val}>]`
  }

  /**
   * 定义当对象需要转换成原始值时的行为
   *
   * 根据不同的转换提示返回适当的值：
   * - 'number': 返回计算结果，尝试进行数值转换
   * - 'string': 调用toString方法获取字符串表示
   * - 'default': 返回计算结果
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
   * 重新计算（依赖追踪）
   *
   * 收集getter函数执行过程中的依赖并建立订阅关系
   */
  private recomputed(): void {
    collectSignal(() => {
      try {
        this._value = this._getter(this._value)
      } catch (e) {
        this.reportError(e, 'computed.getter')
      } finally {
        this._dirty = false
      }
    }, this)
  }
}
