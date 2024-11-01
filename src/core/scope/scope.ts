import { Dispose, DisposeInterface } from './dispose'

/** 入口函数 */
type MainFunction = () => void

/**
 * # 自动处置
 *
 * 当类实例化时会自动将实例对象添加到当前 {@link Scope} 作用域中，当作用域销毁时，会自动触发该实例的销毁方法，从而实现自动清理。
 */
export class AutoDisposed extends Dispose {
  constructor() {
    super()
    // 添加到当前作用域中进行管理
    getCurrentScope()?.add(this)
  }
}

/**
 * # 作用域管理器
 */
export class Scope extends Dispose {
  /** 临时记录当前作用域 */
  static #currentScope?: Scope
  /** 依赖容器 */
  #container?: Set<DisposeInterface> = new Set()

  /**
   * 实例化一个作用域管理器
   *
   * @param main
   */
  constructor(main: MainFunction) {
    super()
    const oldScope = Scope.#currentScope
    Scope.#currentScope = this
    main()
    Scope.#currentScope = oldScope
  }

  /**
   * 获取监听器数量
   *
   * @readonly
   */
  get count() {
    return this.#container?.size ?? 0
  }

  /**
   * 获取当前作用域
   *
   * @returns {Scope|undefined} 返回当前作用域实例，如果没有则返回undefined
   */
  static getCurrentScope(): Scope | undefined {
    return Scope.#currentScope
  }

  /**
   * 添加一个可处置的对象到作用域中。
   *
   * 如果习惯类编程则可以继承自{@link Dispose} 或 {@link AutoDisposed} 类；
   * 函数式编程则可以传入一个对象，对象必须具有`destroy`和`onDestroyed`属性方法。
   *
   * @param dispose - 处置对象
   * @returns {boolean} - 是否添加成功
   */
  add(dispose: DisposeInterface): boolean {
    if (!this.isDeprecated) {
      this.#container?.add(dispose)
      dispose.onDestroyed(() => this.#container?.delete(dispose))
      return true
    } else {
      console.trace('当前作用域已被销毁，不应该再往作用域中增加可处置的对象')
      return false
    }
  }

  /**
   * 触发可处置的对象暂停
   *
   * @override
   */
  override pause() {
    if (!this.isPaused) {
      super.pause()
      this.#container?.forEach(dispose => dispose?.pause?.())
    }
  }

  /**
   * 恢复暂停状态
   *
   * @override
   */
  override unpause() {
    if (this.isPaused) {
      super.unpause()
      this.#container?.forEach(dispose => dispose?.unpause?.())
    }
  }

  /**
   * 销毁作用域下所有监听器
   *
   * @override
   */
  override destroy() {
    if (!this.isDeprecated && this.#container) {
      this.#container.forEach(dispose => dispose.destroy())
      this.#container = undefined
      super.destroy()
    }
  }
}

/**
 * ## 创建作用域
 *
 * @param main 入口函数
 * @returns {Scope} 返回作用域实例，提供了`destroy`方法来销毁作用域
 */
export function createScope(main: VoidFunction): Scope {
  return new Scope(main)
}

/**
 * ## 获取当前作用域
 *
 * @returns {Scope|undefined} 返回当前作用域实例，如果没有则返回undefined
 */
export function getCurrentScope(): Scope | undefined {
  return Scope.getCurrentScope()
}

/**
 * ## 往作用域中添加一个可处置对象
 *
 * @param dispose - 可处置对象
 * @returns {boolean} - 是否添加成功
 */
export function addDispose(dispose: DisposeInterface): boolean {
  return !!getCurrentScope()?.add(dispose)
}
