import { AnyCallback } from '@vitarx/utils'
import type { MakeRequired } from '@vitarx/utils/src/index.js'
import { Effect, EffectScope } from '../effect/index.js'
import { type ParamHandler, Scheduler } from './scheduler.js'

/**
 * 触发时机
 *
 * - 'pre' - 在下一次更新周期开始时触发
 * - 'default' - 默认触发时机
 * - 'post' - 在下一次更新周期结束时触发
 * - 'sync' - 同步触发，不使用批处理
 */
export type Flush = 'default' | 'pre' | 'post' | 'sync'
/**
 * 订阅者配置选项
 */
export interface SubscriberOptions<CB extends AnyCallback = AnyCallback> {
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
  /**
   * 触发时机
   *
   * - 'pre' - 在下一次更新周期开始时触发
   * - 'default' - 默认触发时机
   * - 'post' - 在下一次更新周期结束时触发
   * - 'sync' - 同步触发，不使用批处理
   *
   * @default 'default'
   */
  flush?: Flush
  /**
   * 参数处理函数
   *
   * 当 `flush !== sync` 时生效，在同一个周期内，参数处理函数会接收到新的参数和旧的参数，返回值为处理后的参数。
   *
   * 使用 `watch` | `observer` 相关api时请勿设置，因为 `watch` | `observer` 内置了参数处理逻辑。
   *
   * @param newParams 新传入的参数数组
   * @param oldParams 已存储在队列中的旧参数数组
   */
  paramsHandler?: ParamHandler<Parameters<CB>>
}

/**
 * Subscriber 类是一个基于 Effect 的订阅者实现，用于管理回调函数的触发和生命周期。
 * 它支持限制触发次数、自定义触发时机、参数处理等功能，并提供了完整的生命周期管理。
 *
 * 核心功能：
 * - 支持回调函数的触发和参数处理
 * - 可配置触发时机（同步/异步）
 * - 支持触发次数限制
 * - 提供生命周期管理（创建、销毁、暂停、恢复）
 * - 支持作用域管理
 *
 * @example
 * ```typescript
 * // 创建一个简单的订阅者
 * const subscriber = new Subscriber((msg: string) => {
 *   console.log(msg);
 * }, {
 *   limit: 3,  // 最多触发3次
 *   flush: 'sync'  // 同步触发
 * });
 *
 * // 触发订阅者
 * subscriber.trigger('Hello World');
 * ```
 * @template CB - 回调函数类型
 * @param {CB} callback - 回调函数
 * @param {SubscriberOptions} [options] - 配置选项
 * @param {number} [options.limit=0] - 限制触发次数，0表示不限制
 * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域
 * @param {Flush} [options.flush='default'] - 触发时机（'default'|'pre'|'post'|'sync'）
 * @param {ParamHandler<CB>} [options.paramsHandler] - 参数处理器，用于在批处理中合并多次触发的参数等进阶操作。
 *
 * @warning
 * - 当达到限制次数后，订阅者会自动销毁
 * - 销毁后的订阅者无法再次使用
 * - 在异步触发模式下，回调函数的执行顺序可能与触发顺序不同
 */
export class Subscriber<CB extends AnyCallback = AnyCallback> extends Effect<'notify'> {
  static readonly defaultOptions: MakeRequired<
    SubscriberOptions,
    Exclude<keyof SubscriberOptions, 'paramsHandler'>
  > = {
    limit: 0,
    scope: true,
    flush: 'default'
  }
  /**
   * 触发时机
   */
  public flush: Flush
  /**
   * 限制触发次数
   */
  public limit: number
  /**
   * 当前通知次数
   */
  public count = 0
  /** 回调函数 */
  private _callback: CB | undefined
  /**
   * 参数处理函数
   */
  private readonly _paramsHandler?: ParamHandler<Parameters<CB>>
  /**
   * 创建订阅者
   *
   * @param {CB} callback - 回调函数
   * @param {SubscriberOptions} [options] - 配置选项
   * @param {number} [options.limit=0] - 限制触发次数，默认为0（不限制）
   * @param {boolean} [options.scope=true] - 是否自动添加到当前作用域，默认为true
   * @param {Flush} [options.flush='default'] - 触发时机，默认为 'default'
   * @param {ParamHandler<CB>} [options.paramsHandler] - 参数处理函数
   */
  constructor(callback: CB, options: SubscriberOptions<CB> = {}) {
    super()
    this._callback = callback
    const { scope, flush, limit, paramsHandler } = Object.assign(
      {},
      Subscriber.defaultOptions,
      options
    )
    this._paramsHandler = paramsHandler
    this.flush = flush
    this.limit = limit
    // 自动添加到当前作用域
    if (scope) EffectScope.getCurrentScope()?.addEffect(this)
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
      this._callback = undefined
      return true
    }
    return false
  }

  /**
   * 通知/触发订阅者回调函数
   *
   * 执行回调函数并增加通知计数。如果达到限制次数，会自动销毁。
   *
   * @param {Parameters<CB>} params - 传递给回调函数的参数
   */
  trigger(...params: Parameters<CB>) {
    switch (this.flush) {
      default:
      case 'default':
        Scheduler.queueJob(this._runCallback, params, this._paramsHandler)
        break
      case 'pre':
        Scheduler.queuePreFlushJob(this._runCallback, params, this._paramsHandler)
        break
      case 'post':
        Scheduler.queuePostFlushJob(this._runCallback, params, this._paramsHandler)
        break
      case 'sync':
        this._runCallback.apply(null, params)
        break
    }
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
    this.count = 0
    return true
  }

  /**
   * 执行回调函数的方法
   * @param params - 回调函数所需的参数，类型由回调函数的参数类型决定
   * @returns void
   */
  private _runCallback(...params: Parameters<CB>): void {
    // 如果已销毁或没有回调函数，返回false
    if (this.isDeprecated || !this._callback) return

    // 如果已暂停，返回true但不执行回调
    if (this.isPaused) return
    if (this.limit > 0 && this.count >= this.limit) return
    try {
      // 执行回调
      this._callback.apply(null, params)
    } catch (error) {
      // 报告错误但不中断执行
      this.reportError(error, 'notify')
    }
    // 增加通知计数
    this.count++

    // 检查是否达到限制
    if (this.limit > 0 && this.count >= this.limit) {
      this.dispose()
      return
    }
  }
}
