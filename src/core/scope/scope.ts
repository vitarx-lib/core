import { Effect, type EffectInterface, isEffect } from './effect.js'
import { getContext, runContext } from '../context/index.js'

export interface ScopeOptions {
  /**
   * 是否添加到父级作用域中，如果有。
   *
   * @default false
   */
  toParent?: boolean
  /**
   * 作用域名称，方便调试时更直观的分辨作用域
   *
   * @default unnamed
   */
  name?: string | symbol
  /**
   * 处理副作用抛出的异常
   */
  errorHandler?: ((e: unknown) => void) | null
}

/**
 * # 自动处置
 *
 * 自动将实例对象添加到父级 {@link Scope} 作用域中进行管理，当父级作用域销毁时，
 * 会自动触发该实例的销毁方法，从而实现自动清理。
 */
export class AutoDisposed extends Effect {
  constructor() {
    super()
    // 添加到父级作用域中进行管理
    addEffect(this)
  }
}

/**
 * # 作用域管理器
 */
export class Scope extends Effect {
  // 上下文标识
  static #context_tag = Symbol('ScopeContextSymbol')
  /**
   * 副作用
   *
   * @private
   */
  private _effects?: Set<EffectInterface>
  public readonly config: Required<ScopeOptions>
  /**
   * 实例化一个作用域管理器
   *
   * @param {ScopeOptions} options - 作用域配置项
   * @param {boolean} [options.toParent = false] - 是否添加到父级作用域中，如果有。
   * @param {string|symbol} [options.name = 'anonymous'] - 作用域名称，方便调试时更直观的分辨作用域
   */
  constructor(options?: ScopeOptions) {
    super()
    this.config = Object.assign({ toParent: false, name: 'anonymous', errorHandler: null }, options)
    if (this.config.errorHandler && typeof this.config.errorHandler !== 'function') {
      throw new TypeError('[Vitarx.Scope]：errorHandler必须是一个函数')
    }
    // 添加到父级作用域中
    if (this.config.toParent) Scope.getCurrentScope()?.add(this)
  }

  get name(): string | symbol {
    return this.config.name
  }
  /**
   * 副作用数量
   *
   * @readonly
   */
  get count(): number {
    return this._effects?.size ?? 0
  }

  /**
   * 获取当前作用域
   *
   * @returns {Scope|undefined} 返回当前作用域实例，如果没有则返回undefined
   */
  static getCurrentScope(): Scope | undefined {
    return getContext(Scope.#context_tag)
  }

  /**
   * 运行一个函数，捕获副作用
   *
   * > 注意：如果函数内部存在await，需要使用`withAsyncContext`维护上下文，否则在await之后的副作用将无法捕获。
   *
   * @template T
   * @param {() => T} fn - 函数
   * @return {T} - 函数的返回值
   */
  run<T>(fn: () => T): T {
    return runContext(Scope.#context_tag, this, fn)
  }

  /**
   * 添加一个可处置的副作用到当前作用域中。
   *
   * 如果习惯类编程则可以继承自{@link Effect} 或 {@link AutoDisposed} 类；
   * 函数式编程则可以传入一个对象，对象必须具有`destroy`和`onDestroyed`属性方法。
   *
   * @param effect - 处置对象
   * @returns {boolean} - 是否添加成功
   */
  add(effect: EffectInterface): boolean {
    if (this.isDeprecated) {
      console.warn('当前作用域已被销毁，不应该再往作用域中增加可处置的副作用对象')
      return false
    } else {
      if (!isEffect(effect)) {
        throw new TypeError(
          '添加到作用域中管理的对象必须是 Effect 或 AutoDisposed 的实例，或实现 EffectInterface 接口'
        )
      }
      // 添加错误处理
      if (this.config.errorHandler && effect.onError) {
        effect.onError(this.config.errorHandler)
      }
      if (!this._effects) {
        this._effects = new Set([effect])
      } else {
        this._effects?.add(effect)
      }
      effect.onDestroyed(() => this._effects?.delete(effect))
      return true
    }
  }

  /**
   * 销毁作用域下所有监听器
   *
   * @override
   */
  override destroy() {
    if (!this.isDeprecated) {
      this._effects?.forEach(dispose => {
        try {
          dispose.destroy()
        } catch (e) {
          this.reportError(e)
        }
      })
      this._effects = undefined
      this.config.errorHandler = null
      super.destroy()
    }
  }

  /**
   * 暂停所有可处置的副作用
   *
   * @override
   */
  override pause() {
    if (!this.isPaused) {
      this._effects?.forEach(dispose => dispose?.pause?.())
      super.pause()
    }
    return this
  }

  /**
   * 恢复所有可处置的副作用
   *
   * @override
   */
  override unpause() {
    if (this.isPaused) {
      this._effects?.forEach(dispose => dispose?.unpause?.())
      super.unpause()
    }
  }
}

/**
 * ## 创建作用域
 *
 * @returns {Scope} 返回作用域实例，提供了`destroy`方法来销毁作用域
 * @param {ScopeOptions} options - 作用域配置项
 * @param {string} [options.name = 'anonymity'] - 作用域名称，方便调试时更直观的分辨作用域
 * @param {boolean} [options.toParent = false] - 是否添加到父级作用域中，如果有。
 */
export function createScope(options?: ScopeOptions): Scope {
  return new Scope(options)
}

/**
 * ## 获取当前作用域
 *
 * 如果是在组件中获取作用域，请勿私自销毁它。
 *
 * @returns {Scope|undefined} 返回当前作用域实例，如果没有则返回undefined
 * @alias useCurrentScope
 */
export function getCurrentScope(): Scope | undefined {
  return Scope.getCurrentScope()
}

export { getCurrentScope as useCurrentScope }

/**
 * ## 往作用域中添加一个副作用对象
 *
 * @param {EffectInterface} effect - 实现了`EffectInterface`接口的对象
 * @returns {boolean} - 是否添加成功
 */
export function addEffect(effect: EffectInterface): boolean {
  return !!getCurrentScope()?.add(effect)
}
