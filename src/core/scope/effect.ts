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
 * 副作用效果状态：
 * - `active`: 活跃状态
 * - `paused`: 暂停状态
 * - `deprecated`: 弃用状态
 */
export type EffectState = 'active' | 'paused' | 'deprecated'

/**
 * # 可处置的副作用
 *
 * 提供了销毁、暂停、取消暂停等能力，并且可以监听销毁、暂停、取消暂停等事件。
 */
export class Effect implements EffectInterface {
  /**
   * 销毁回调
   *
   * @protected
   */
  protected onDestroyedCallback?: VoidCallback[]
  /**
   * 暂停回调
   *
   * @protected
   */
  protected onPauseCallback?: VoidCallback[]
  /**
   * 取消暂停回调
   *
   * @protected
   */
  protected onUnPauseCallback?: VoidCallback[]
  /**
   * 状态
   *
   * @protected
   */
  protected _state: EffectState = 'active'

  /**
   * 状态
   */
  get state(): EffectState {
    return this._state
  }

  /**
   * 是否已弃用/销毁
   *
   * @readonly
   */
  get isDeprecated() {
    return this.state === 'deprecated'
  }

  /**
   * 判断是否为暂停状态
   */
  get isPaused(): boolean {
    return this.state === 'paused'
  }

  /**
   * 判断是否处于活跃状态
   */
  get isActive(): boolean {
    return this.state === 'active'
  }

  /**
   * 销毁/弃用
   *
   * 调用此方法会将标记为弃用状态，并触发销毁回调，清理所有回调函数释放内存。
   */
  destroy(): void {
    if (!this.isDeprecated) {
      this._state = 'deprecated'
      if (this.onDestroyedCallback) {
        this.onDestroyedCallback.forEach(callback => callback())
        this.onDestroyedCallback = undefined
      }
      this.onPauseCallback = undefined
      this.onUnPauseCallback = undefined
    }
  }

  /**
   * 暂停
   *
   * @returns {this}
   */
  pause(): this {
    if (this.state !== 'active') {
      throw new Error('Effect not active.')
    }
    if (this.isPaused) return this
    this._state = 'paused'
    this.onPauseCallback?.forEach(callback => callback())
    return this
  }

  /**
   * 取消暂停
   *
   * @returns {this}
   */
  unpause(): this {
    this._state = 'active'
    this.onUnPauseCallback?.forEach(callback => callback())
    return this
  }

  /**
   * 监听销毁
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onDestroyed(callback: VoidCallback): this {
    if (this.isDeprecated) {
      throw new Error('Effect already deprecated.')
    } else {
      if (this.onDestroyedCallback) {
        this.onDestroyedCallback.push(callback)
      } else {
        this.onDestroyedCallback = [callback]
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
    if (this.isDeprecated) {
      throw new Error('Effect already deprecated.')
    }
    if (this.onPauseCallback) {
      this.onPauseCallback.push(callback)
    } else {
      this.onPauseCallback = [callback]
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
    if (this.isDeprecated) {
      throw new Error('Effect already deprecated.')
    }
    if (this.onUnPauseCallback) {
      this.onUnPauseCallback.push(callback)
    } else {
      this.onUnPauseCallback = [callback]
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
  if (!obj || typeof obj !== 'object') return false
  if (obj instanceof Effect) return true
  return typeof obj.destroy === 'function' && typeof obj.onDestroyed === 'function'
}
