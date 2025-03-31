import { Effect, EffectScope } from '../effect/index'

/**
 * 信号监听选项
 */
export interface SignalListenerOptions {
  /**
   * 是否立即执行一次回调
   *
   * @default false
   */
  immediate?: boolean

  /**
   * 限制执行的次数
   *
   * 小于 1 则不限制次数，大于 0 则限制次数
   *
   * @default 0
   */
  limit?: number

  /**
   * 是否将监听器附加到当前上下文中的作用域
   * 当设置为true时，会自动将当前监听器添加到当前作用域中。
   *
   * @default true
   */
  addToCurrentScope?: boolean
}

/**
 * 信号监听器 - 用于管理和控制信号的监听行为
 *
 * SignalListener类提供了一个灵活的信号监听机制，可以：
 * - 控制监听器的生命周期
 * - 限制监听器的触发次数
 * - 自动绑定到当前作用域
 * - 支持暂停/恢复监听
 *
 * @template CB - 监听回调函数类型，必须是一个可调用的函数类型
 *
 * @example
 * ```ts
 * // 创建一个基本的信号监听器
 * const listener = new SignalListener((value: number) => {
 *   console.log('Signal received:', value)
 * })
 *
 * // 创建一个有限制次数的监听器
 * const limitedListener = new SignalListener(
 *   (value: number) => {
 *     console.log('Limited signal:', value)
 *   },
 *   { limit: 3 } // 只触发3次
 * )
 * ```
 */
export class SignalListener<CB extends AnyCallback = AnyCallback> extends Effect<'trigger'> {
  // 监听回调
  #callback?: CB
  // 已触发次数
  #count = 0
  // 配置选项
  readonly #config: Required<SignalListenerOptions>

  /**
   * 创建一个新的信号监听器实例
   *
   * @param callback - 信号触发时要执行的回调函数
   * @param options - 监听器的配置选项
   */
  constructor(callback: CB, options?: SignalListenerOptions) {
    super()
    this.#callback = callback
    this.#config = {
      immediate: false,
      limit: 0,
      addToCurrentScope: true,
      ...options
    }
    if (this.#config.addToCurrentScope) {
      // 将监听器添加到当前作用域中
      EffectScope.getCurrentScope()?.addEffect(this)
    }
  }

  /**
   * 获取监听器已经触发的次数
   *
   * @returns {number} 返回监听器从创建到现在的触发总次数
   */
  get count(): number {
    return this.#count
  }

  /**
   * 获取监听器的触发次数限制
   *
   * @returns {number} 返回配置的触发次数限制值，0表示无限制
   */
  get limit(): number {
    return this.config.limit
  }

  /**
   * 获取监听器的完整配置信息
   *
   * @returns {Readonly<Required<SignalListenerOptions>>} 返回只读的监听器配置对象
   */
  get config(): Readonly<Required<SignalListenerOptions>> {
    return this.#config
  }

  /**
   * 销毁当前监听器实例
   * 销毁后监听器将不再响应任何信号触发
   *
   * @returns {Boolean} 返回是否成功销毁，true表示成功，false表示已经被销毁
   */
  override dispose(): boolean {
    const result = super.dispose()
    if (result) this.#callback = undefined
    return result
  }

  /**
   * 触发信号监听器
   *
   * 当触发监听器时：
   * 1. 如果监听器已销毁，返回false
   * 2. 如果监听器已暂停，返回true但不执行回调
   * 3. 执行回调函数并增加触发计数，如果回调函数执行过程中抛出异常，异常会被捕获并通过reportError报告
   * 4. 如果达到触发次数限制，自动销毁监听器
   *
   * @param params - 传递给回调函数的参数列表
   * @returns {boolean} 如果监听器处于活跃状态返回true，如果已销毁返回false
   */
  public trigger(...params: Parameters<CB>): boolean {
    if (this.isDeprecated || !this.#callback) return false
    if (this.isPaused) return true
    // 如果没有限制触发次数或触发次数小于限制次数则触发回调
    try {
      this.#callback.apply(null, params)
    } catch (e) {
      this.reportError(e, 'trigger')
    }
    this.#count++
    // 判断是否已达到预期的监听次数
    if (this.limit > 0 && this.#count >= this.limit) {
      this.dispose()
    }
    return true
  }
}
