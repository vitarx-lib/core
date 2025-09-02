import { getContext, runInContext } from '../context/index.js'
import type { EffectCallbackErrorHandler, EffectInterface } from './effect-interface.js'
import { Effect } from './effect.js'
import { isEffect } from './helpers.js'

/**
 * 作用域配置项接口，用于配置EffectScope实例的行为
 *
 * @interface
 */
export interface EffectScopeOptions {
  /**
   * 是否将当前作用域附加到当前上下文中的作用域
   * 当设置为true时，会自动将当前作用域添加到父级作用域中
   *
   * @default false
   */
  attachToCurrentScope?: boolean

  /**
   * 作用域名称，用于在调试时更直观地识别作用域
   * 可以是字符串或Symbol类型
   *
   * @default "anonymous"
   */
  name?: string | symbol

  /**
   * 用于处理作用域内副作用抛出的异常
   *
   * @param {unknown} error - 异常对象
   */
  errorHandler?: EffectCallbackErrorHandler | null
}

/**
 * 作用域管理器类，用于管理和控制副作用的生命周期
 *
 * @extends {Effect}
 */
export class EffectScope extends Effect {
  /**
   * 作用域上下文标识符，用于在上下文中唯一标识作用域
   *
   * @public
   * @static
   * @readonly
   */
  public static readonly contextTag = Symbol('EFFECT_SCOPE_CONTEXT_TAG')

  /**
   * 作用域配置对象，包含所有配置项的必填版本
   *
   * @public
   * @readonly
   */
  public readonly config: Required<EffectScopeOptions>

  /**
   * 存储当前作用域管理的所有副作用对象的集合
   *
   * @private
   */
  private _effectSet?: Set<EffectInterface>

  /**
   * 创建一个新的作用域管理器实例
   *
   * @param {EffectScopeOptions} [options] - 作用域配置选项
   * @throws {TypeError} 当errorHandler不是函数类型时抛出
   */
  constructor(options?: EffectScopeOptions) {
    super()
    this.config = Object.assign(
      { attachToCurrentScope: false, name: 'anonymous', errorHandler: null },
      options
    )
    if (this.config.errorHandler && typeof this.config.errorHandler !== 'function') {
      throw new TypeError('[Vitarx.EffectScope]: The errorHandler must be a function type')
    }
    if (this.config.attachToCurrentScope) EffectScope.getCurrentScope()?.addEffect(this)
  }

  /**
   * 获取作用域名称
   *
   * @returns {string | symbol} 作用域名称
   */
  get name(): string | symbol {
    return this.config.name
  }

  /**
   * 获取当前作用域中的副作用数量
   *
   * @returns {number} 副作用数量
   * @readonly
   */
  get count(): number {
    return this._effectSet?.size ?? 0
  }

  /**
   * 获取当前上下文中的作用域实例
   *
   * @returns {EffectScope | undefined} 当前作用域实例，如果不存在则返回undefined
   * @static
   */
  static getCurrentScope(): EffectScope | undefined {
    return getContext(EffectScope.contextTag)
  }

  /**
   * 在当前作用域上下文中运行函数并捕获其产生的副作用
   *
   * @template T - 函数返回值类型
   * @param {() => T} fn - 要执行的函数
   * @returns {T} 函数的返回值
   * @throws {Error} 当函数执行出错时抛出
   * @remarks
   * 如果函数内部存在异步操作（await），需要使用`withAsyncContext` API维护上下文，
   * 否则在await之后的副作用将无法被正确捕获
   */
  run<T>(fn: () => T): T {
    return runInContext(EffectScope.contextTag, this, fn)
  }

  /**
   * 向作用域中添加一个可处置的副作用对象
   *
   * @param {EffectInterface} effect - 要添加的副作用对象
   * @returns {EffectScope} 当前作用域实例，用于链式调用
   * @throws {Error} 当作用域已经被销毁时抛出
   * @throws {TypeError} 当effect不是有效的副作用对象时抛出
   */
  addEffect(effect: EffectInterface): this {
    if (this.isDeprecated) {
      throw new Error('[Vitarx.EffectScope]: Cannot add effects to a destroyed scope')
    }

    if (!isEffect(effect)) {
      throw new TypeError('[Vitarx.EffectScope]: Effect objects must implement the EffectInterface')
    }

    if (this.config.errorHandler && effect.onError) {
      effect.onError(this.config.errorHandler)
    }

    if (!this._effectSet) {
      this._effectSet = new Set([effect])
    } else {
      this._effectSet.add(effect)
    }

    effect.onDispose(() => this._effectSet?.delete(effect))

    return this
  }

  /**
   * 销毁作用域并清理所有副作用
   * 此操作会触发所有副作用的dispose方法，并清空内部存储
   *
   * @returns {boolean} 操作结果，如果操作成功则返回true，否则返回false
   * @override
   */
  override dispose(): boolean {
    if (super.dispose()) {
      this._effectSet?.forEach(effect => {
        try {
          effect.dispose()
        } catch (error) {
          this.reportError(error, 'dispose')
        }
      })
      this._effectSet = undefined
      this.config.errorHandler = null
      return true
    }
    return false
  }

  /**
   * 暂停作用域中的所有副作用
   * 此操作会触发所有副作用的pause方法
   *
   * @returns {boolean} 操作结果，如果操作成功则返回true，否则返回false
   * @override
   */
  override pause(): boolean {
    if (super.pause()) {
      this._effectSet?.forEach(effect => effect?.pause?.())
      return true
    }
    return false
  }

  /**
   * 恢复作用域中的所有副作用
   * 此操作会触发所有副作用的resume方法
   *
   * @returns {boolean} 操作结果，如果操作成功则返回true，否则返回false
   * @override
   */
  override resume(): boolean {
    if (super.resume()) {
      this._effectSet?.forEach(effect => effect.resume())
      return true
    }
    return false
  }
}
