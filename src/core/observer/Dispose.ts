import { VoidCallback } from '../../types/common'

/**
 * 继承该类可提供销毁回调能力
 */
export default abstract class Dispose {
  // 销毁回调
  #onDestroyedCallback?: VoidCallback[]
  // 弃用状态
  #isDeprecated = false
  /**
   * 判断是否已被弃用
   *
   * @readonly
   */
  get isDeprecated() {
    return this.#isDeprecated
  }

  /**
   * 销毁/弃用
   *
   * 调用此方法会将标记为弃用状态，并触发销毁回调。
   */
  destroy(): void {
    if (!this.#isDeprecated) {
      this.#isDeprecated = true
      if (this.#onDestroyedCallback) {
        this.#onDestroyedCallback.forEach(callback => {
          try {
            callback()
          } catch (e) {
            console.error('Listener.Callback.Error', e)
          }
        })
        this.#onDestroyedCallback = undefined
      }
    }
  }

  /**
   * 监听销毁
   *
   * @param callback
   */
  onDestroyed(callback: VoidCallback): void {
    if (this.#isDeprecated) {
      callback()
    } else {
      if (this.#onDestroyedCallback) {
        this.#onDestroyedCallback.push(callback)
      } else {
        this.#onDestroyedCallback = [callback]
      }
    }
  }
}
