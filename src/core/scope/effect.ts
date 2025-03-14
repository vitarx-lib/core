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

  /** 监听错误 */
  onError?(callback: ErrorCallback): void
}

/**
 * 副作用效果状态：
 * - `active`: 活跃状态
 * - `paused`: 暂停状态
 * - `deprecated`: 弃用状态
 */
export type EffectState = 'active' | 'paused' | 'deprecated'
type ErrorCallback = (e: unknown) => void
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
  protected onDestroyedCallback?: Set<VoidCallback>
  /**
   * 暂停回调
   *
   * @protected
   */
  protected onPauseCallback?: Set<VoidCallback>
  /**
   * 取消暂停回调
   *
   * @protected
   */
  protected onUnPauseCallback?: Set<VoidCallback>
  /**
   * 错误处理器
   *
   * @protected
   */
  protected onErrorCallback?: Set<ErrorCallback>
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
      this.triggerCallback('onDestroyed')
      this.onDestroyedCallback = undefined
      this.onPauseCallback = undefined
      this.onUnPauseCallback = undefined
      this.onErrorCallback = undefined
    }
  }

  /**
   * 监听销毁
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onDestroyed(callback: VoidCallback): this {
    return this.addCallback(callback, 'onDestroyed')
  }

  /**
   * 暂停
   *
   * @returns {this}
   */
  pause(): void {
    if (this.state !== 'active') {
      throw new Error('Effect not active.')
    }
    this._state = 'paused'
    this.triggerCallback('onPause')
  }

  /**
   * 取消暂停
   *
   * @returns {this}
   */
  unpause(): void {
    if (this.state !== 'paused') {
      throw new Error('Effect not paused.')
    }
    this._state = 'active'
    this.triggerCallback('onUnPause')
  }

  /**
   * 监听暂停
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onPause(callback: VoidCallback): this {
    return this.addCallback(callback, 'onPause')
  }

  /**
   * 监听取消暂停
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onUnPause(callback: VoidCallback): this {
    return this.addCallback(callback, 'onError')
  }

  /**
   * 监听回调异常
   *
   * @param {ErrorCallback} callback - 回调函数
   * @returns {this}
   */
  onError(callback: ErrorCallback): this {
    return this.addCallback(callback, 'onUnPause')
  }

  /**
   * 报告回调异常
   *
   * @param e
   * @protected
   */
  protected reportError(e: unknown) {
    this.onErrorCallback?.forEach(callback => callback(e))
  }

  /**
   * 添加回调函数
   *
   * @param callback
   * @param type
   * @private
   */
  private addCallback(
    callback: AnyCallback,
    type: 'onError' | 'onUnPause' | 'onPause' | 'onDestroyed'
  ) {
    if (this.isDeprecated) {
      throw new Error('Effect already deprecated.')
    }
    if (typeof callback !== 'function') {
      throw new TypeError('callback参数必须是一个函数')
    }
    const store = `${type}Callback` as 'onErrorCallback'
    if (this[store]) {
      this[store].add(callback)
    } else {
      this[store] = new Set([callback])
    }
    return this
  }

  /**
   * 触发回调
   *
   * @param type
   * @private
   */
  private triggerCallback(type: 'onUnPause' | 'onPause' | 'onDestroyed') {
    const store = `${type}Callback` as 'onDestroyedCallback'
    this[store]?.forEach(callback => {
      try {
        callback()
      } catch (e) {
        this.reportError(e)
      }
    })
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
