import { AnyCallback } from '@vitarx/utils'
import { Effect, EffectScope } from '../effect'

/**
 * 订阅者配置选项
 */
export interface SubscriberOptions {
  /**
   * 限制通知次数
   *
   * 设置为0表示不限制次数
   *
   * @default 0
   */
  limit?: number

  /**
   * 是否自动添加到当前作用域
   *
   * 当设置为true时，会自动将订阅者添加到当前作用域中，
   * 作用域销毁时会自动清理订阅者
   *
   * @default true
   */
  scope?: boolean
}

/**
 * # 订阅者类
 *
 * 负责管理订阅回调和生命周期，支持限制通知次数和作用域管理。
 *
 * @template CB - 回调函数类型
 */
export class Subscriber<CB extends AnyCallback = AnyCallback> extends Effect<'notify'> {
  // 订阅回调函数
  #callback?: CB
  // 限制触发次数
  readonly #limit: number
  // 已触发次数
  #notificationCount = 0

  /**
   * 创建订阅者
   *
   * @param {CB} callback - 回调函数
   * @param {SubscriberOptions} [options] - 配置选项
   * @param {number} [options.limit=0] - 限制触发次数，默认为0（不限制）
   * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，默认为true
   */
  constructor(callback: CB, options: SubscriberOptions = {}) {
    super()
    const { limit = 0, scope = true } = options
    this.#callback = callback
    this.#limit = limit

    // 自动添加到当前作用域
    if (scope) EffectScope.getCurrentScope()?.addEffect(this)
  }

  /**
   * 获取已触发次数
   */
  get count(): number {
    return this.#notificationCount
  }

  /**
   * 获取限制触发次数
   */
  get limit(): number {
    return this.#limit
  }

  /**
   * 销毁订阅者
   *
   * 调用此方法会将订阅者标记为已销毁，并触发清理回调。
   *
   * @returns {boolean} - 销毁是否成功
   */
  override dispose(): boolean {
    if (super.dispose()) {
      this.#callback = undefined
      return true
    }
    return false
  }

  /**
   * 通知/触发订阅者回调函数
   *
   * 执行回调函数并增加通知计数。如果达到限制次数，会自动销毁订阅者。
   *
   * @param {any[]} params - 传递给回调函数的参数
   * @returns {boolean} - 返回订阅者是否仍然活跃
   */
  trigger(...params: Parameters<CB>): boolean {
    // 如果已销毁或没有回调函数，返回false
    if (this.isDeprecated || !this.#callback) return false

    // 如果已暂停，返回true但不执行回调
    if (this.isPaused) return true
    if (this.#limit > 0 && this.#notificationCount >= this.#limit) return false
    try {
      // 执行回调
      this.#callback.apply(null, params)
    } catch (error) {
      // 报告错误但不中断执行
      this.reportError(error, 'notify')
    }

    // 增加通知计数
    this.#notificationCount++

    // 检查是否达到限制
    if (this.#limit > 0 && this.#notificationCount >= this.#limit) {
      this.dispose()
      return false
    }
    return true
  }

  /**
   * 重置通知计数
   *
   * 将通知计数重置为0，允许订阅者重新开始计数。
   *
   * @returns {boolean} - 重置是否成功
   */
  resetCount(): boolean {
    if (this.isDeprecated) return false
    this.#notificationCount = 0
    return true
  }
}
