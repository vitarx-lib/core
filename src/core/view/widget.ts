import type { VElement } from './VElement.js'

export abstract class Widget {
  /** 组件唯一标识符 */
  private readonly _key: string | symbol | undefined

  /**
   * 构造函数
   *
   * @param key
   * @protected
   */
  protected constructor(key?: string | symbol) {
    this._key = key
  }

  /**
   * 唯一键
   *
   * @readonly
   */
  get key(): string | symbol | undefined {
    return this._key
  }

  /**
   * 将此 `widget` 转换为具体的`VElement`实例。
   *
   * 给定的 `widget` 可以零次或多次包含在树中。
   * 特别是，给定的 `widget` 可以多次放置在树中。
   * 每次将 `widget` 放置在树中时，它都会转换成 `VElement`，
   * 这意味着多次合并到树中的 `widget` 将被多次转换。
   *
   * @protected
   */
  protected abstract createElement(): VElement<Widget>
}
