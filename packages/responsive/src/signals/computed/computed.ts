import { isFunction, isObject, logger } from '@vitarx/utils'
import {
  addToActiveScope,
  bindDebuggerOptions,
  clearEffectLinks,
  collectSignal,
  type DebuggerOptions,
  type DisposableEffect,
  type EffectHandle,
  removeFromOwnerScope,
  reportEffectError,
  trackSignal,
  triggerSignal
} from '../../core/index.js'
import { IS_REF, IS_SIGNAL, type RefSignal } from '../shared/index.js'

/**
 * 计算属性的值获取函数
 *
 * @template T - 计算结果值的类型
 * @param {T | undefined} oldValue - 上一次的计算结果，第一次计算时为undefined
 * @returns {T} - 计算结果
 */
export type ComputedGetter<T> = (oldValue: T) => T
/**
 * 计算属性的setter处理函数
 *
 * @template T - 同计算结果的类型
 */
export type ComputedSetter<T> = (newValue: T) => void

/**
 * # 计算属性
 *
 * 计算属性是一种特殊的响应式数据，它的值由一个getter函数计算得出。
 * 当依赖的响应式数据发生变化时，计算属性会自动重新计算并更新其值。
 *
 * @template T - 计算结果的类型
 * @implements {Ref<T>} - 实现RefSignal接口，使其可以像普通的响应式引用一样使用
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
export class Computed<T> implements RefSignal<T>, DisposableEffect {
  readonly [IS_REF]: true = true
  readonly [IS_SIGNAL]: true = true
  /**
   * 脏标记，标识是否需要重新计算
   * true表示依赖已变化，需要重新计算
   * @private
   */
  public dirty: boolean = true
  /**
   * 计算属性的getter函数
   * @private
   */
  private readonly _getter: ComputedGetter<T>
  /**
   * 计算属性的setter函数
   * @private
   */
  private readonly _setter: ComputedSetter<T> | undefined
  /**
   * 副作用句柄，用于管理计算属性的副作用
   */
  private readonly _effect: EffectHandle

  constructor(getter: ComputedGetter<T>, debuggerOptions?: DebuggerOptions)

  constructor(
    options: { get: ComputedGetter<T>; set: ComputedSetter<T> },
    debuggerOptions?: DebuggerOptions
  )

  constructor(
    getter: ComputedGetter<T> | { get: ComputedGetter<T>; set: ComputedSetter<T> },
    debuggerOptions?: DebuggerOptions
  )

  constructor(
    getter: ComputedGetter<T> | { get: ComputedGetter<T>; set: ComputedSetter<T> },
    debuggerOptions?: DebuggerOptions
  ) {
    // 处理作用域
    addToActiveScope(this)
    if (isFunction(getter)) {
      this._getter = getter
    } else if (isObject(getter)) {
      this._getter = getter.get
      this._setter = getter.set
    } else {
      throw new Error('[Computed] getter must be a function')
    }
    this._effect = () => {
      if (!this.dirty) {
        this.dirty = true
        triggerSignal(this, 'dirty')
      }
    }
    if (__DEV__) {
      if (debuggerOptions) bindDebuggerOptions(this._effect, debuggerOptions)
    }
  }

  /**
   * 计算结果缓存
   * @private
   */
  private _value!: T

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
    if (this.dirty) this.immediate()
    // 追踪对value属性的访问
    trackSignal(this, 'get')
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
      try {
        this._setter(newValue)
      } catch (e) {
        reportEffectError(this, e, 'computed.setter')
      }
    } else {
      logger.warn(
        'Computed properties should not be modified directly unless a setter function is defined.'
      )
    }
  }

  dispose(): void {
    removeFromOwnerScope(this)
    clearEffectLinks(this._effect)
  }

  /**
   * 将计算属性转换为字符串
   *
   * @returns {string} 字符串表示
   */
  toString(): string {
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
   * 立即执行计算的方法
   * 该方法会触发重新计算并返回当前实例，支持链式调用
   * @returns {this} 返回当前实例，以便支持链式调用
   */
  immediate(): this {
    // 调用重新计算方法
    collectSignal(() => {
      try {
        this._value = this._getter(this._value)
      } catch (e) {
        reportEffectError(this, e, 'computed.getter')
      } finally {
        this.dirty = false
      }
    }, this._effect)
    // 返回当前实例，支持链式调用
    return this
  }
}
