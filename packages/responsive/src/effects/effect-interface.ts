/**
 * 副作用回调函数类型
 */
export type EffectCallbackErrorSource = 'dispose' | 'pause' | 'resume'
/**
 * 错误回调函数类型
 * @param e - 捕获到的异常
 */
export type EffectCallbackErrorHandler = (e: unknown, source: EffectCallbackErrorSource) => void

/**
 * 副作用状态：
 * - `active`: 活跃状态
 * - `paused`: 暂停状态
 * - `deprecated`: 弃用状态
 */
export type EffectState = 'active' | 'paused' | 'deprecated'

/**
 * 副作用接口
 *
 * 提供了销毁、暂停、恢复等生命周期管理功能，以及相应的事件监听能力。
 * 实现此接口的对象可以被自动管理和释放资源。
 */
export interface EffectInterface {
  /**
   * 释放实例资源
   *
   * 调用此方法应将实例标记为弃用状态，触发销毁回调，并清理所有事件监听。
   * 销毁后的实例应无法再次使用。
   *
   * @returns {void}
   */
  dispose(): void

  /**
   * 监听实例销毁事件
   *
   * @param callback - 销毁事件的回调函数
   * @returns {void}
   */
  onDispose(callback: VoidCallback): void

  /**
   * 暂停当前实例的功能
   *
   * 仅当实例处于活跃状态时可调用。
   * 调用后会触发暂停事件回调。
   *
   * @throws {Error} 当实例不处于活跃状态时应抛出错误
   * @returns {void}
   */
  pause(): void

  /**
   * 监听实例暂停事件
   *
   * @param {VoidCallback} callback - 暂停事件的回调函数
   * @returns {void}
   */
  onPause(callback: VoidCallback): void

  /**
   * 恢复当前实例的功能
   *
   * 仅当实例处于暂停状态时可调用。
   * 调用后会触发恢复事件回调。
   *
   * @throws {Error} 当实例不处于暂停状态时抛出错误
   * @returns {void}
   */
  resume(): void

  /**
   * 监听实例恢复事件
   *
   * @param callback - 恢复事件的回调函数
   * @returns {void}
   */
  onResume(callback: VoidCallback): void

  /**
   * 监听回调函数异常
   *
   * 当调用回单函数发生异常时，会将捕获到的异常报告给错误处理器处理
   *
   * > 注意：请勿在错误处理器中继续抛出异常，如果继续抛出异常，为避免死循环，
   * 内部会使用 `console.error(error)` 打印日志。
   *
   * @param {EffectCallbackErrorHandler} errorHandler - 错误处理回调函数
   * @returns {void}
   */
  onError(errorHandler: EffectCallbackErrorHandler): void

  /**
   * 获取当前实例状态
   *
   * @returns {EffectState} 当前实例的状态
   */
  getState(): EffectState
}
