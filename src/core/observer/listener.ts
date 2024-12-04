import { addEffect, Effect } from '../scope/index.js'

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
   * @param {number} limit - 限制触发次数，0为不限制
   */
  constructor(callback: C, limit: number = 0) {
    super()
    this.#callback = callback
    this.#limit = limit ?? 0
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
   * 创建监听器
   *
   * 静态方法，用于创建监听器，并自动把监听器提交到依赖监听器中。
   *
   * 如果你不希望在依赖监听器中跟踪监听器，则可以直接使用`new Listener`。
   *
   * @param callback
   * @param limit
   */
  static create<C extends AnyCallback>(callback: C, limit: number = 0): Listener<C> {
    // 创建监听器
    const instance = new Listener(callback, limit)
    // 添加到当前作用域进行自动管理
    addEffect(instance)
    return instance
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
   * 暂停回调
   *
   * 调用此方法过后，trigger将会被忽略，直到unpause方法被调用
   */
  override pause() {
    super.pause()
  }

  /**
   * 取消暂停回调
   *
   * 调用此方法后，如果之前处于暂停状态，则会继续触发回调。
   */
  override unpause() {
    super.unpause()
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
        console.error('[Vitarx.Listener.Callback]：', e)
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
  reset(): boolean {
    if (this.isDeprecated) return false
    this.#count = 0
    return true
  }
}
