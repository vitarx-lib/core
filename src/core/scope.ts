import { DependListener, Listener } from './observer'
import Dispose from './observer/dispose'

/**
 * # 作用域管理器
 */
export class Scope extends Dispose {
  // 监听器集合
  #listeners?: Set<Listener>

  /**
   * 实例化一个作用域管理器
   *
   * @param main
   */
  constructor(main: VoidFunction) {
    super()
    this.#listeners = DependListener.collect(main.bind(this))
  }

  /**
   * 销毁作用域下所有监听器
   *
   * @override
   */
  override destroy() {
    if (!this.isDeprecated && this.#listeners) {
      this.#listeners.forEach(listener => listener.destroy())
      this.#listeners = undefined
      super.destroy()
    }
  }
}

/**
 * 创建作用域
 *
 * @param main 入口函数
 * @returns {Scope} 返回作用域实例，提供了`destroy`方法来销毁作用域
 */
export function createScope(main: VoidFunction): Scope {
  return new Scope(main)
}
