import type {
  EffectCallbackErrorHandler,
  EffectCallbackErrorSource,
  EffectInterface,
  EffectState
} from './effect-interface'

/**
 * Effect类提供了一个通用的副作用管理实现
 *
 * 该类设计用于管理具有生命周期的副作用操作，提供了：
 * - 状态管理：支持active（活跃）、paused（暂停）和deprecated（弃用）三种状态
 * - 生命周期钩子：可监听销毁(dispose)、暂停(pause)和恢复(resume)事件
 * - 错误处理：统一的错误捕获和处理机制
 *
 * 主要应用场景：
 * - 资源管理：管理需要及时清理的资源（如定时器、事件监听器等）
 * - 状态同步：协调多个相关联的副作用操作
 * - 可中断任务：支持暂停和恢复的长期运行任务
 */
export class Effect implements EffectInterface {
  /**
   * 回调函数集合
   *
   * @protected
   */
  protected callbacks?: Map<EffectCallbackErrorSource | 'error', Set<AnyCallback>>
  /**
   * 状态
   *
   * @protected
   */
  protected _state: EffectState = 'active'

  /**
   * 状态:
   *   - `active`: 活跃
   *   - `paused`: 暂停
   *   - `deprecated`: 弃用
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
   * 状态:
   *   - `active`: 活跃
   *   - `paused`: 暂停
   *   - `deprecated`: 弃用
   */
  getState(): EffectState {
    return this._state
  }

  /**
   * 销毁/弃用
   *
   * 调用此方法会将标记为弃用状态，并触发销毁回调，清理所有回调函数释放内存。
   */
  dispose(): void {
    if (this.isDeprecated) return
    this._state = 'deprecated'
    this.triggerCallback('dispose')
    this.clearCallbacks()
  }

  /**
   * 监听销毁
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onDispose(callback: VoidCallback): this {
    return this.addCallback(callback, 'dispose')
  }

  /**
   * 暂停
   *
   * @returns {this}
   */
  pause(): void {
    if (!this.isActive) {
      throw new Error('Effect must be active to pause.')
    }
    this._state = 'paused'
    this.triggerCallback('pause')
  }

  /**
   * 恢复
   *
   * @returns {this}
   */
  resume(): void {
    if (!this.isPaused) {
      throw new Error('Effect must be paused to resume.')
    }
    this._state = 'active'
    this.triggerCallback('resume')
  }

  /**
   * 监听暂停事件
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onPause(callback: VoidCallback): this {
    return this.addCallback(callback, 'pause')
  }

  /**
   * 监听恢复事件
   *
   * @param {VoidCallback} callback - 回调函数
   * @returns {this}
   */
  onResume(callback: VoidCallback): this {
    return this.addCallback(callback, 'resume')
  }

  /**
   * 监听错误事件
   *
   * @param {EffectCallbackErrorHandler} callback - 回调函数
   * @returns {this}
   */
  onError(callback: EffectCallbackErrorHandler): this {
    return this.addCallback(callback, 'error')
  }

  /**
   * 清理所有回调函数
   *
   * @private
   */
  private clearCallbacks(): void {
    if (this.callbacks) {
      this.callbacks.clear()
      this.callbacks = undefined
    }
  }

  /**
   * 报告回调异常
   *
   * @param {unknown} e - 捕获到的异常
   * @param {EffectCallbackErrorSource} source - 回调事件源
   * @protected
   */
  protected reportError(e: unknown, source: EffectCallbackErrorSource): void {
    const errorHandlers = this.callbacks?.get('error')
    if (errorHandlers) {
      errorHandlers.forEach(callback => {
        try {
          callback(e, source)
        } catch (innerError) {
          console.error(`Error handler for "${source}" threw an error:`, innerError)
        }
      })
    } else {
      console.error(`Unhandled error in effect callback (${source}):`, e)
    }
  }

  /**
   * 添加回调函数
   *
   * @param callback
   * @param type
   * @private
   */
  private addCallback(callback: AnyCallback, type: EffectCallbackErrorSource | 'error'): this {
    if (this.isDeprecated) {
      throw new Error('Cannot add callback to a deprecated effect.')
    }
    if (typeof callback !== 'function') {
      throw new TypeError(`Callback parameter for "${type}" must be a function.`)
    }
    if (!this.callbacks) {
      this.callbacks = new Map()
    }
    const callbackSet = this.callbacks.get(type) || new Set()
    callbackSet.add(callback)
    this.callbacks.set(type, callbackSet)
    return this
  }

  private triggerCallback(type: EffectCallbackErrorSource): void {
    const callbacks = this.callbacks?.get(type)
    if (!callbacks) return
    callbacks.forEach(callback => {
      try {
        callback()
      } catch (e) {
        this.reportError(e, type)
      }
    })
  }
}

/**
 * 检测是否为可处置副作用对象
 *
 * @param {any} obj - 要检测的对象
 * @returns {boolean} 如果对象实现了 EffectInterface，则返回 true，否则返回 false
 */
export const isEffect = (obj: any): obj is EffectInterface => {
  if (!obj || typeof obj !== 'object') return false
  if (obj instanceof Effect) return true
  return (
    typeof obj.dispose === 'function' &&
    typeof obj.onDispose === 'function' &&
    typeof obj.pause === 'function' &&
    typeof obj.onPause === 'function' &&
    typeof obj.resume === 'function' &&
    typeof obj.onResume === 'function' &&
    typeof obj.onError === 'function' &&
    typeof obj.getState === 'function'
  )
}
