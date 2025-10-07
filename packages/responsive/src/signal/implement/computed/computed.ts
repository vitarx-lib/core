import { isFunction, microTaskDebouncedCallback } from '@vitarx/utils'
import type { MakeRequired } from '@vitarx/utils/src/index.js'
import { Depend } from '../../../depend/index.js'
import { EffectScope } from '../../../effect/index.js'
import { Observer, Subscriber } from '../../../observer/index.js'
import {
  DEEP_SIGNAL_SYMBOL,
  REF_SIGNAL_SYMBOL,
  type RefSignal,
  SIGNAL_RAW_VALUE_SYMBOL,
  SIGNAL_SYMBOL,
  SignalManager
} from '../../core/index.js'
import type { ComputedOptions } from './types.js'

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
   * 计算结果缓存
   * @private
   */
  private _computedResult: T = undefined as T

  /**
   * 计算属性的getter函数
   * @private
   */
  private readonly _getter: (oldValue: T | undefined) => T

  /**
   * 计算属性的配置选项
   * @private
   */
  private readonly _options: MakeRequired<
    ComputedOptions<T>,
    Exclude<keyof ComputedOptions<T>, 'setter'>
  >

  /**
   * 依赖变化的订阅处理器
   * @private
   */
  private _handler: Subscriber | undefined = undefined
  /**
   * 作用域
   * @private
   */
  private _scope: EffectScope | undefined = undefined
  /**
   * 构造一个计算属性对象
   *
   * @param {(oldValue: T | undefined) => T} getter - 计算属性的getter函数，接收上一次的计算结果作为参数
   * @param {ComputedOptions<T>} [options={}] - 计算属性的配置选项
   * @param {(newValue: T) => void} [options.setter] - 计算属性的setter函数，用于处理对计算属性的赋值操作
   * @param {boolean} [options.immediate=false] - 是否立即计算，默认为false，首次访问时才计算
   * @param {boolean} [options.scope=true] - 是否添加到当前作用域，默认为true，作用域销毁时自动清理
   * @param {boolean} [options.batch=true] - 是否使用批处理模式，默认为true，多个连续的变更会合并为一次计算
   */
  constructor(getter: (oldValue: T | undefined) => T, options: ComputedOptions<T> = {}) {
    this._getter = getter
    this._options = Object.assign(
      {
        immediate: false,
        scope: true,
        batch: true
      },
      options
    )
    if (this._options.scope) this._scope = EffectScope.getCurrentScope()
    // 如果设置了立即计算，则在构造时就初始化
    if (options.immediate) this.init()
  }

  /**
   * 是否已初始化
   * @private
   */
  private _initialize: boolean = false

  /**
   * 获取初始化状态的访问器
   * 返回一个布尔值，表示对象是否已初始化
   * @returns {boolean} 返回内部的_initialize属性值
   */
  get initialize(): boolean {
    return this._initialize
  }

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
   * 如果计算属性尚未初始化，则会先进行初始化。
   * 每次访问都会追踪依赖，以便在依赖变化时能够正确地通知订阅者。
   *
   * @returns {T} 计算结果
   */
  get value(): T {
    // 如果尚未初始化，则先初始化
    this.init()
    // 追踪对value属性的访问
    Depend.track(this, 'value')
    return this._computedResult
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
    if (typeof this._options.setter === 'function') {
      this._options.setter(newValue)
    } else {
      console.warn(
        '[Computed]：Computed properties should not be modified directly unless a setter function is defined。'
      )
    }
  }

  /**
   * 将计算属性转换为字符串
   *
   * 如果计算结果有toString方法，则调用该方法；
   * 否则，返回格式化的类型描述。
   *
   * @returns {string} 字符串表示
   */
  toString(): string {
    if (this.value?.toString && isFunction(this.value.toString)) {
      return this.value.toString()
    } else {
      return `[Object Computed<${typeof this.value}>]`
    }
  }

  /**
   * 停止监听依赖变化
   *
   * 调用此方法会停止对依赖的监听，并释放相关监听器。
   * 计算属性将不再响应依赖的变化，但仍然保留最后一次计算的结果。
   *
   * @returns {T} 最后一次的计算结果
   */
  stop(): T {
    if (this._handler) {
      this._handler.dispose()
      this._handler = undefined
      this._scope = undefined
    } else {
      this._computedResult = this._getter(undefined)
    }
    return this._computedResult
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
   * 此方法仅在计算属性被初始化之前设置有效
   *
   * @param {boolean | EffectScope} scope - 作用域或boolean值，表示是否允许添加到作用域
   * @returns {this} 当前实例，支持链式调用
   */
  public scope(scope: boolean | EffectScope): this {
    if (this.initialize) return this
    if (scope instanceof EffectScope) {
      this._scope = scope
    } else if (scope) {
      this._scope = EffectScope.getCurrentScope()
    }
    return this
  }

  /**
   * 手动初始化计算属性
   *
   * 执行以下步骤：
   * 1. 收集getter函数执行过程中的依赖
   * 2. 缓存计算结果
   * 3. 如果有依赖，创建订阅处理器监听依赖变化
   * 4. 设置清理函数，在销毁时移除订阅
   *
   * @returns {this} 当前实例，支持链式调用
   */
  init(): this {
    if (this.initialize) return this
    // 标记为已初始化
    this._initialize = true

    // 收集依赖并获取初始计算结果
    const { result, deps } = Depend.collect(() => this._getter(this._computedResult), 'exclusive')

    // 缓存计算结果
    this._computedResult = result

    // 如果有依赖，则创建订阅处理器
    if (deps.size > 0) {
      const handler = () => {
        // 重新计算结果
        const newResult = this._getter(this._computedResult)

        // 只有当结果发生变化时才通知订阅者
        if (newResult !== this._computedResult) {
          this._computedResult = newResult
          SignalManager.notifySubscribers(this, 'value')
        }
      }
      // 创建订阅处理器，使用微任务延迟执行以提高性能
      this._handler = new Subscriber(
        !this._options.batch ? handler : microTaskDebouncedCallback(handler),
        { scope: false }
      )
      // 如果存在作用域，则添加到作用域中
      if (this._scope) this._scope.addEffect(this._handler)
      // 为每个依赖添加订阅
      deps.forEach((props, signal) => {
        for (const prop of props) {
          Observer.addSubscriber(signal, prop, this._handler!, {
            batch: false, // 禁用批处理，确保及时更新
            autoRemove: false // 不自动移除，由onDispose处理
          })
        }
      })

      // 设置清理函数，在销毁时移除所有订阅
      this._handler.onDispose(() => {
        deps.forEach((props, signal) => {
          for (const prop of props) {
            Observer.removeSubscriber(signal, prop, this._handler!, false)
          }
        })
        this._handler = undefined
        this._scope = undefined
      })
    } else {
      console.warn(
        '[Computed]：No dependencies detected in computed property. The computed value will not automatically update when data changes. Consider checking if your getter function accesses signal properties correctly.'
      )
    }
    return this
  }
}
