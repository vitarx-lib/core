import { VoidCallback } from '@vitarx/utils'

/**
 * 错误处理回调函数类型
 *
 * @param {unknown} e - 捕获到的异常对象
 * @param {string} source - 错误来源，指示在哪个生命周期事件中发生的错误
 *
 * @example
 * ```ts
 * const errorHandler: EffectCallbackErrorHandler = (error, source) => {
 *   console.error(`Error in ${source} operation:`, error);
 * }
 * ```
 */
export type EffectCallbackErrorHandler<ErrorSource extends string = string> = (
  e: unknown,
  source: ErrorSource
) => void

/**
 * 副作用状态枚举
 *
 * @remarks
 * 副作用对象在其生命周期中可能处于以下三种状态之一：
 * - `active`: 活跃状态，表示副作用正常运行中
 * - `paused`: 暂停状态，副作用暂时停止但可以恢复
 * - `deprecated`: 弃用状态，副作用已被销毁且无法恢复
 *
 * 状态转换规则：
 * 1. active -> paused: 通过pause()方法
 * 2. paused -> active: 通过resume()方法
 * 3. active/paused -> deprecated: 通过dispose()方法
 * 4. deprecated状态为终态，无法转换到其他状态
 */
export type EffectState = 'active' | 'paused' | 'deprecated'

/**
 * 副作用接口
 *
 * @remarks
 * 定义了可管理的副作用对象的标准接口，提供生命周期管理和事件监听能力。
 * 实现此接口的对象将获得：
 * - 完整的生命周期管理（创建、暂停、恢复、销毁）
 * - 事件监听机制（状态变更通知）
 * - 统一的错误处理
 *
 * @example
 * ```ts
 * class MyEffect implements EffectInterface {
 *   private state: EffectState = 'active';
 *
 *   dispose() {
 *     this.state = 'deprecated';
 *     // 清理资源...
 *   }
 *
 *   // 实现其他接口方法...
 * }
 * ```
 */
export interface EffectInterface<ErrorSource extends string = string> {
  /**
   * 销毁/释放实例资源
   *
   * @remarks
   * 此方法用于清理实例占用的资源，执行后会：
   * 1. 将实例标记为弃用状态
   * 2. 触发所有注册的销毁回调函数
   * 3. 清理所有事件监听器
   *
   * @example
   * ```ts
   * const effect = new Effect();
   * effect.dispose(); // 销毁实例
   * console.log(effect.getState()); // 输出: 'deprecated'
   * ```
   *
   * @returns {boolean} 如果释放操作成功，则返回true，否则返回false
   */
  dispose(): boolean

  /**
   * 监听实例销毁事件
   *
   * @remarks
   * 注册一个在实例被销毁时触发的回调函数。
   * 如果实例已经处于deprecated状态，则添加回调会抛出错误。
   *
   * @param callback - 销毁事件的回调函数，在实例被销毁时执行
   * @throws {Error} 当实例已处于deprecated状态时抛出
   * @example
   * ```ts
   * effect.onDispose(() => {
   *   console.log('Effect has been disposed');
   *   // 清理相关资源...
   * });
   * ```
   */
  onDispose(callback: VoidCallback): void

  /**
   * 暂停当前实例的功能
   *
   * @remarks
   * 将实例状态从active切换到paused，暂时停止其功能。
   * 暂停后可以通过resume()方法恢复。
   *
   * @throws {Error} 当实例不处于active状态时抛出错误
   * @example
   * ```ts
   * if (effect.isActive) {
   *   effect.pause();
   *   console.log(effect.getState()); // 输出: 'paused'
   * }
   * ```
   *
   * @returns {boolean} 如果暂停操作成功，则返回true，否则返回false
   */
  pause(): boolean

  /**
   * 监听实例暂停事件
   *
   * @remarks
   * 注册一个在实例被暂停时触发的回调函数。
   * 可以用于在暂停时执行一些清理或状态保存操作。
   *
   * @param {VoidCallback} callback - 暂停事件的回调函数
   * @throws {Error} 当实例处于deprecated状态时抛出
   * @example
   * ```ts
   * effect.onPause(() => {
   *   console.log('Effect has been paused');
   *   // 保存当前状态...
   * });
   * ```
   */
  onPause(callback: VoidCallback): void

  /**
   * 恢复当前实例的功能
   *
   * @remarks
   * 将实例状态从paused恢复到active，重新启用其功能。
   * 只有处于paused状态的实例才能被恢复。
   *
   * @throws {Error} 当实例不处于paused状态时抛出错误
   * @example
   * ```ts
   * if (effect.isPaused) {
   *   effect.resume();
   *   console.log(effect.getState()); // 输出: 'active'
   * }
   * ```
   *
   * @returns {boolean} 如果恢复操作成功，则返回true，否则返回false
   */
  resume(): boolean

  /**
   * 监听实例恢复事件
   *
   * @remarks
   * 注册一个在实例从暂停状态恢复时触发的回调函数。
   * 可以用于在恢复时重新初始化或恢复之前的状态。
   *
   * @param callback - 恢复事件的回调函数
   * @throws {Error} 当实例处于deprecated状态时抛出
   * @example
   * ```ts
   * effect.onResume(() => {
   *   console.log('Effect has been resumed');
   *   // 恢复之前的状态...
   * });
   * ```
   */
  onResume(callback: VoidCallback): void

  /**
   * 监听回调函数异常
   *
   * @remarks
   * 注册一个用于处理所有回调函数执行过程中产生的异常的处理器。
   * 错误处理器接收到异常后应该进行适当的错误处理，而不是继续抛出异常。
   *
   * @param {EffectCallbackErrorHandler} errorHandler - 错误处理回调函数
   * @throws {Error} 当实例处于deprecated状态时抛出
   *
   * @example
   * ```ts
   * effect.onError((error, source) => {
   *   console.error(`Error in ${source} callback:`, error);
   *   // 进行错误处理...
   * });
   * ```
   *
   * @remarks
   * 注意：请勿在错误处理器中继续抛出异常，如果继续抛出异常，为避免死循环，
   * 内部会使用 `console.error(error)` 打印日志。
   */
  onError(errorHandler: EffectCallbackErrorHandler<ErrorSource>): void

  /**
   * 获取当前实例状态
   *
   * @remarks
   * 返回实例当前的生命周期状态：
   * - 'active': 正常工作状态
   * - 'paused': 暂停状态
   * - 'deprecated': 已销毁状态
   *
   * @returns {EffectState} 当前实例的状态
   * @example
   * ```ts
   * const state = effect.getState();
   * if (state === 'active') {
   *   // 实例正常工作中...
   * }
   * ```
   */
  getState(): EffectState
}
