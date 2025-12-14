import { EffectScope, getCurrentScope } from './scope.js'
import { NEXT_EFFECT, PREV_EFFECT } from './symbol.js'

/**
 * 副作用状态枚举
 *
 * - active: 活跃状态，表示当前效果正在运行。
 * - paused: 暂停状态，表示当前效果已暂停。
 * - deprecated: 弃用状态，表示当前效果已被弃用。
 */
export type EffectState = 'active' | 'paused' | 'deprecated'
export interface EffectOptions {
  /**
   * 作用域
   *
   * - ture 表示当前效果将自动加入当前作用域。
   * - false 表示当前效果将不会加入任何作用域。
   * - EffectScope 对象 ：表示当前效果将加入指定的作用域。
   *
   * @default true
   */
  scope?: EffectScope | boolean
}
/**
 * 最小化的副作用基类
 *
 * 设计原则：
 * - 保持非常轻量，仅管理状态与生命周期钩子；
 * - 提供受保护的 beforeX 钩子供子类实现自定义清理/暂停/恢复逻辑；
 * - 提供 _prev/_next 链表引用，供 EffectScope 做 O(1) 的添加/删除；
 * - 提供 _scope，按照约定自定义的effect需将异常报告给 _scope.handleError 处理；
 *
 * 约定：
 * - 不要修改_开头的属性，它们可以被读取，但是一定不要修改。
 * - 副作用发生的异常应该交由 _scope.handleError 进行处理。
 */
export abstract class Effect {
  /**
   * 双向链表节点引用
   *
   * @readonly  由scope注入（由 Scope 使用）—— 注意：不可直接修改
   */
  [PREV_EFFECT]?: Effect;
  /**
   * 双向链表节点引用
   *
   * @readonly 由scope注入（由 Scope 使用）—— 注意：不可直接修改
   */
  [NEXT_EFFECT]?: Effect
  /**
   * 所属作用域
   *
   * @readonly 由scope注入（自定义Effect可以调用this._scope.handleError(e,source)上报异常） —— 注意：不可直接修改
   */
  _scope?: EffectScope

  /** 当前状态 */
  private _state: EffectState = 'active'
  protected constructor(options?: EffectOptions) {
    const scope = options?.scope ?? true
    if (scope === true) {
      getCurrentScope()?.addEffect(this)
    } else if (typeof scope === 'object') {
      scope.addEffect(this)
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
  get isDeprecated(): boolean {
    return this._state === 'deprecated'
  }

  /**
   * 弃用当前副作用实例
   */
  dispose(): void {
    if (this.isDeprecated) throw new Error('Effect is already deprecated.')

    // 从作用域链表中删除自己
    this._scope?.removeEffect(this)

    this.beforeDispose?.()
    this._state = 'deprecated'
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
   * 抛出异常
   *
   * @param e - 异常对象
   * @param source - 异常源
   */
  protected reportError(e: unknown, source: string): void {
    if (this._scope) {
      this._scope.handleError(e, source)
    } else {
      throw e
    }
  }
  /* ---------- 前置/后置钩子 (供子类覆盖) ---------- */
  protected beforeDispose?(): void
  protected beforePause?(): void
  protected beforeResume?(): void
  protected afterDispose?(): void
  protected afterPause?(): void
  protected afterResume?(): void
}
