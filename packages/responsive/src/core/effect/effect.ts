import { removeFromOwnerScope, reportEffectError } from './helpers.js'
import { type DisposableEffect, EffectScope, getActiveScope } from './scope.js'

/**
 * 副作用状态枚举
 *
 * - active: 活跃状态，表示当前效果正在运行。
 * - paused: 暂停状态，表示当前效果已暂停。
 * - disposed: 弃用状态，表示当前效果已被弃用。
 */
export type EffectState = 'active' | 'paused' | 'disposed'

/**
 * 通用型副作用基类
 *
 * 设计原则：
 * - 保持非常轻量，仅管理状态与生命周期钩子；
 * - 提供受保护的 beforeX / afterX 钩子供子类实现自定义清理/暂停/恢复逻辑；
 *
 * 约定：
 * - 副作用发生非预期异常应该主动捕获并交由 reportError 方法进行向上报告。
 */
export abstract class Effect implements DisposableEffect {
  /** 当前状态 */
  private _state: EffectState = 'active'
  constructor(scope: EffectScope | boolean = true) {
    if (scope === true) {
      getActiveScope()?.add(this)
    } else if (typeof scope === 'object') {
      scope.add(this)
    }
  }
  /**
   * 获取当前状态
   */
  get state(): EffectState {
    return this._state
  }

  /**
   * 判断当前状态是否为活跃状态
   */
  get isActive(): boolean {
    return this._state === 'active'
  }

  /**
   * 判断当前状态是否为暂停状态
   */
  get isPaused(): boolean {
    return this._state === 'paused'
  }

  /**
   * 判断当前状态是否为弃用状态
   */
  get isDisposed(): boolean {
    return this._state === 'disposed'
  }

  /**
   * 弃用当前副作用实例
   */
  dispose(): void {
    if (this.isDisposed) throw new Error('Effect is already disposed.')

    this.beforeDispose?.()
    this._state = 'disposed'
    // 从作用域链表中删除自己
    removeFromOwnerScope(this)
    this.afterDispose?.()
  }

  /**
   * 暂停当前副作用实例
   */
  pause(): void {
    if (!this.isActive) throw new Error('Effect must be active to pause.')
    this.beforePause?.()
    this._state = 'paused'
    this.afterPause?.()
  }

  /**
   * 恢复当前副作用实例
   */
  resume(): void {
    if (!this.isPaused) throw new Error('Effect must be paused to resume.')
    this.beforeResume?.()
    this._state = 'active'
    this.afterResume?.()
  }
  /**
   * 报告非预期异常
   *
   * @param e - 捕获的非预期异常/通常是Error对象
   * @param source - 异常源/字符串类型，帮助定位异常发生地：watcher.callback
   */
  protected reportError(e: unknown, source: string): void {
    reportEffectError(this, e, source)
  }
  /* ---------- 前置/后置钩子 (供子类覆盖) ---------- */
  protected beforeDispose?(): void
  protected beforePause?(): void
  protected beforeResume?(): void
  protected afterDispose?(): void
  protected afterPause?(): void
  protected afterResume?(): void
}
