import { isFunction } from '../../utils/index.js'

/**
 * 处置功能接口
 *
 * 实现 `DisposeInterface` 接口
 */
export interface EffectInterface {
  /** 销毁 */
  destroy(): void

  /** 监听销毁 */
  onDestroyed(callback: AnyCallback): void

  /** 暂停：可选 */
  pause?(): void

  /** 取消暂停：可选 */
  unpause?(): void
}

/**
 * # 可处置的副作用
 *
 * 提供了销毁、暂停、取消暂停等能力，并且可以监听销毁、暂停、取消暂停等事件。
 */
export class Effect implements EffectInterface {
  // 销毁回调
  #onDestroyedCallback?: VoidCallback[]
  #onPause?: VoidCallback[]
  #onUnPause?: VoidCallback[]
  // 弃用状态
  #isDeprecated = false
  // 暂停状态
  #pause = false

  /**
   * 是否已弃用/销毁
   *
   * @readonly
   */
  get isDeprecated() {
    return this.#isDeprecated
  }

  /**
   * 判断是否为暂停状态
   */
  get isPaused(): boolean {
    return this.#pause
  }

  /**
   * 销毁/弃用
   *
   * 调用此方法会将标记为弃用状态，并触发销毁回调，清理所有回调函数释放内存。
   */
  destroy(): void {
    if (!this.#isDeprecated) {
      this.#isDeprecated = true
      if (this.#onDestroyedCallback) {
        this.#onDestroyedCallback.forEach(callback => callback())
        this.#onDestroyedCallback = undefined
      }
      this.#onPause = undefined
      this.#onUnPause = undefined
    }
  }

  /**
   * 暂停
   *
   * @returns {this}
   */
  pause(): this {
    this.#pause = true
    this.#onPause?.forEach(callback => callback())
    return this
  }

  /**
   * 取消暂停
   *
   * @returns {this}
   */
  unpause(): this {
    this.#pause = false
    this.#onUnPause?.forEach(callback => callback())
    return this
  }

  /**
   * 监听销毁
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onDestroyed(callback: VoidCallback): this {
    if (this.#isDeprecated) {
      callback()
    } else {
      if (this.#onDestroyedCallback) {
        this.#onDestroyedCallback.push(callback)
      } else {
        this.#onDestroyedCallback = [callback]
      }
    }
    return this
  }

  /**
   * 监听暂停
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onPause(callback: VoidCallback): this {
    if (!this.#isDeprecated) {
      if (this.#onPause) {
        this.#onPause.push(callback)
      } else {
        this.#onPause = [callback]
      }
    }
    return this
  }

  /**
   * 监听取消暂停
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onUnPause(callback: VoidCallback): this {
    if (!this.#isDeprecated) {
      if (this.#onUnPause) {
        this.#onUnPause.push(callback)
      } else {
        this.#onUnPause = [callback]
      }
    }
    return this
  }
}

/**
 * 检测是否为可处置副作用对象
 *
 * @param obj
 */
export function isEffect(obj: any): obj is EffectInterface {
  if (obj instanceof Effect) return true
  return !(!isFunction(obj?.destroy) || !isFunction(obj?.onDestroyed))
}
