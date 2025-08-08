import { AnyCallback, VoidCallback } from '@vitarx/utils'
import type { EffectCallbackErrorHandler, EffectInterface, EffectState } from './effect-interface'

/**
 * 副作用固有错误来源
 *
 * @remarks
 * 定义了副作用对象可能触发的三种错误来源：
 * - `dispose`: 销毁事件，表示资源释放
 * - `pause`: 暂停事件，临时停止副作用
 * - `resume`: 恢复事件，重新激活副作用
 */
export type EffectInherentErrorSource = 'dispose' | 'pause' | 'resume'

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
 *
 * @template ErrorSource - 错误源类型
 */
export class Effect<ErrorSource extends string = string>
  implements EffectInterface<EffectInherentErrorSource | ErrorSource>
{
  /**
   * 回调函数集合
   *
   * @protected
   */
  protected callbacks?: Map<EffectInherentErrorSource | 'error', Set<AnyCallback>>
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
   * @inheritDoc
   */
  dispose(): boolean {
    if (this.isDeprecated) return true
    this._state = 'deprecated'
    this.triggerCallback('dispose')
    this.clearCallbacks()
    return true
  }

  /**
   * @inheritDoc
   */
  onDispose(callback: VoidCallback): this {
    return this.addCallback(callback, 'dispose')
  }

  /**
   * @inheritDoc
   */
  pause(): boolean {
    if (!this.isActive) {
      throw new Error('Effect must be active to pause.')
    }
    this._state = 'paused'
    this.triggerCallback('pause')
    return true
  }

  /**
   * @inheritDoc
   */
  resume(): boolean {
    if (!this.isPaused) {
      throw new Error('Effect must be paused to resume.')
    }
    this._state = 'active'
    this.triggerCallback('resume')
    return true
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
  onError(callback: EffectCallbackErrorHandler<EffectInherentErrorSource | ErrorSource>): this {
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
   * @param {EffectInherentErrorSource} source - 回调事件源
   * @protected
   */
  protected reportError(e: unknown, source: EffectInherentErrorSource | ErrorSource): void {
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
   * 触发回调
   *
   * @param type
   * @protected
   */
  protected triggerCallback(type: EffectInherentErrorSource): void {
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

  /**
   * 添加回调函数
   *
   * @param callback
   * @param type
   * @private
   */
  private addCallback(callback: AnyCallback, type: EffectInherentErrorSource | 'error'): this {
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
}
