import type { AnyKey } from '@vitarx/utils'
import { isFunction, logger } from '@vitarx/utils'
import { Depend } from '../../depend/index.js'
import { EffectScope } from '../../effect/index.js'
import { SubManager, Subscriber } from '../../observer/index.js'
import {
  DEEP_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL
} from '../constants.js'
import { SignalManager } from '../manager.js'
import type { RefSignal } from '../types/index.js'

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
export interface ComputedOptions<T> {
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
  /**
   * 是否自动添加到当前作用域
   *
   * 如果设置为true，则自动添加到当前的EffectScope中，作用域销毁时自动清理。
   * 如果设置为false，则不添加到作用域，需要手动管理生命周期。
   * 也可以传入具体的EffectScope实例。
   *
   * @default true
   */
  scope?: boolean | EffectScope
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
export class Computed<T> implements RefSignal<T> {
  /**
   * 标识是否为深度响应式对象
   * 计算属性不支持深度响应，始终为false
   */
  readonly [DEEP_SIGNAL_SYMBOL]: boolean = false

  /**
   * 标识为引用类型的响应式信号
   */
  readonly [REF_SIGNAL_SYMBOL]: true = true

  /**
   * 标识为响应式信号对象
   */
  readonly [SIGNAL_SYMBOL]: true = true

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
   * 依赖变化的订阅处理器
   * @private
   */
  private _effect: Subscriber | undefined = undefined
  /**
   * 作用域实例
   * @private
   */
  private _scope: EffectScope | undefined = undefined
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
    this._getter = getter
    this._setter = options.setter

    // 处理作用域
    const { scope = true, immediate = false } = options
    if (scope) {
      if (typeof scope === 'object') {
        this._scope = scope
      } else {
        this._scope = EffectScope.getCurrentScope()
      }
    }

    // 如果设置了立即计算，则在构造时就初始化（setupEffect会自动计算并缓存）
    if (immediate) {
      this._setupEffect()
    }
  }

  /**
   * 计算结果缓存
   * @private
   */
  private _value: T = undefined as T

  /**
   * 获取计算属性的原始值
   * 实现BaseSignal接口的SIGNAL_RAW_VALUE_SYMBOL属性
   *
   * @returns {T} 计算结果的原始值
   */
  get [SIGNAL_RAW_VALUE_SYMBOL](): T {
    return this.value
  }

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
    if (!this._isSetup) {
      this._setupEffect()
    }

    // 如果dirty为true，说明依赖已变化，需要重新计算
    if (this._dirty) {
      this._evaluate()
    }

    // 追踪对value属性的访问
    Depend.track(this, 'value')

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
   * 停止监听依赖变化
   *
   * 调用此方法会停止对依赖的监听，并释放相关资源。
   * 计算属性将不再响应依赖的变化，但仍然保留最后一次计算的结果。
   *
   * @returns {T} 返回当前缓存的计算结果
   */
  stop(): T {
    if (this._effect) {
      this._effect.dispose()
      this._effect = undefined
    }
    this._isSetup = false
    this._scope = undefined
    return this._value
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
   * 设置作用域
   *
   * 此方法仅在副作用设置之前调用有效
   *
   * @param {boolean | EffectScope} scope - 作用域或boolean值
   * @returns {this} 当前实例，支持链式调用
   */
  public setScope(scope: boolean | EffectScope): this {
    if (this._isSetup) return this

    if (scope instanceof EffectScope) {
      this._scope = scope
    } else if (scope) {
      this._scope = EffectScope.getCurrentScope()
    } else {
      this._scope = undefined
    }

    return this
  }

  /**
   * 执行计算
   *
   * Vue风格的懒计算：仅在dirty为true时才执行getter并缓存结果
   * 注意：此方法不收集依赖，依赖收集在_setupEffect中完成
   * @private
   */
  private _evaluate(): void {
    // 直接执行getter，不需要收集依赖
    this._value = this._getter(this._value)
    this._dirty = false
  }

  /**
   * 设置副作用（依赖追踪）
   *
   * 执行以下步骤：
   * 1. 收集getter函数执行过程中的依赖，并缓存结果
   * 2. 为每个依赖创建订阅，当依赖变化时智能处理
   * 3. 将副作用添加到作用域中（如果存在）
   * 4. 设置清理函数，在销毁时移除所有订阅
   * @private
   */
  private _setupEffect(): void {
    if (this._isSetup) return
    this._isSetup = true

    // 收集依赖并缓存结果（只执行一次getter）
    const { result, deps } = Depend.collect(() => this._getter(this._value), 'exclusive')

    // 缓存结果并清除dirty标记，避免首次访问时重复计算
    this._value = result
    this._dirty = false

    // 如果有依赖，则创建订阅处理器
    if (deps.size > 0) {
      // 当依赖变化时的智能处理
      const onDependencyChange = () => {
        this._dirty = true
        SignalManager.notifySubscribers(this, 'value')
      }

      // 创建订阅处理器，使用同步模式立即响应依赖变化
      this._effect = new Subscriber(onDependencyChange, {
        flush: 'sync',
        scope: false
      })

      // 如果存在作用域，则添加到作用域中
      if (this._scope) {
        this._scope.addEffect(this._effect)
      }

      const cleanupList: Array<[object, AnyKey]> = []

      // 为每个依赖添加订阅
      deps.forEach((props, signal) => {
        for (const prop of props) {
          SubManager.addSubscriber(signal, prop, this._effect!, false)
          cleanupList.push([signal, prop])
        }
      })

      // 设置清理函数，在销毁时移除所有订阅
      this._effect.onDispose(() => {
        for (const [signal, prop] of cleanupList) {
          SubManager.removeSubscriber(signal, prop, this._effect!)
        }
        cleanupList.length = 0
      })
    } else {
      logger.warn(
        'No dependencies detected in computed property. The computed value will not automatically update when data changes. Consider checking if your getter function accesses signal properties correctly.'
      )
    }
  }
}
