import { AnyCallback } from '../../types/common'
import Dispose from './Dispose'

/**
 * 监听器
 *
 * @template C - 回调函数的类型
 */
export default class Listener<C extends AnyCallback = AnyCallback> extends Dispose {
  // 监听回调函数
  #callback?: C
  // 限制触发次数
  readonly #limit: number
  // 已触发次数
  #count = 0
  // 暂停状态
  #pause = false

  /**
   * 创建监听器
   *
   * @template C - 回调函数的类型
   * @param {C} callback - 回调函数
   * @param {number} limit - 限制触发次数，0为不限制
   */
  constructor(callback: C, limit: number = 0) {
    super()
    this.#callback = callback
    this.#limit = limit ?? 0
  }

  /**
   * 判断是否为暂停状态
   */
  get isPaused(): boolean {
    return this.#pause
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
   * 创建一个只触发一次的监听器
   *
   * @template C - 回调函数的类型
   *
   * @param {C} callback - 回调函数
   *
   * @returns {Listener<C>}
   */
  static once<C extends AnyCallback>(callback: C): Listener<C> {
    return new Listener(callback, 1)
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
    if (this.#pause) return true
    // 如果没有限制触发次数或触发次数小于限制次数则触发回调
    if (this.#limit === 0 || this.#count < this.#limit) {
      try {
        this.#callback.apply(null, params)
      } catch (e) {
        console.error('Listener.Callback.Error', e)
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
   * 暂停回调
   *
   * 调用此方法过后，trigger方法会忽略回调，直到unpause方法被调用
   */
  pause() {
    this.#pause = true
  }

  /**
   * 取消暂停回调
   *
   * 调用此方法后，如果之前处于暂停状态，则继续触发回调。
   */
  unpause() {
    this.#pause = false
  }

  /**
   * 重置已触发的次数
   *
   * 如果已被销毁，则返回false
   *
   * @returns {boolean} 重置成功返回true，否则返回false。
   */
  reset(): boolean {
    if (this.isDeprecated) return false
    this.#count = 0
    return true
  }
}
