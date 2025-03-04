import { addEffect, Effect } from '../scope/index.js'
import Logger from '../logger.js'

export type ListenerOptions = {
  /**
   * 限制触发次数
   *
   * @default 0
   */
  limit?: number
  /**
   * 自动添加到作用域
   *
   * @default true
   */
  scope?: boolean
}
/**
 * # 监听器类
 *
 * @template C - 回调函数的类型
 */
export class Listener<C extends AnyCallback = AnyCallback> extends Effect {
  // 监听回调函数
  #callback?: C
  // 限制触发次数
  readonly #limit: number
  // 已触发次数
  #count = 0
  /**
   * 创建监听器
   *
   * @template C - 回调函数的类型
   * @param {C} callback - 回调函数
   * @param options
   */
  constructor(callback: C, { limit = 0, scope = true }: ListenerOptions = {}) {
    super()
    this.#callback = callback
    this.#limit = limit ?? 0
    if (scope) addEffect(this)
  }
  /**
   * 已触发次数
   *
   * @returns {number}
   */
  get count(): number {
    return this.#count
  }

  /**
   * 获取限制触发次数
   *
   * @returns {number}
   */
  get limit(): number {
    return this.#limit
  }

  /**
   * 销毁/弃用监听器
   *
   * 调用此方法会将监听器标记为弃用状态，并触发销毁回调。
   */
  override destroy(): void {
    if (!this.isDeprecated) {
      super.destroy()
      this.#callback = undefined
    }
  }

  /**
   * 触发监听，如果监听器被销毁，则返回false
   *
   * @param {any[]} params - 要传给回调函数的参数列表
   * @returns {boolean} 返回一个bool值表示当前监听器是否活跃，false代表已经销毁
   */
  trigger(params: Parameters<C>): boolean {
    if (this.isDeprecated || !this.#callback) return false
    if (this.isPaused) return true
    // 如果没有限制触发次数或触发次数小于限制次数则触发回调
    if (this.#limit === 0 || this.#count < this.#limit) {
      try {
        this.#callback.apply(null, params)
      } catch (e) {
        Logger.error(e)
      }
      this.#count++
      // 判断是否已达到预期的监听次数
      if (this.#limit !== 0 && this.#count >= this.#limit) {
        this.destroy()
        return false
      }
      return true
    } else {
      return false
    }
  }

  /**
   * 重置已触发的次数
   *
   * 如果已被销毁，则返回false
   *
   * @returns {boolean} 重置成功返回true，否则返回false。
   */
  resetCount(): boolean {
    if (this.isDeprecated) return false
    this.#count = 0
    return true
  }
}
