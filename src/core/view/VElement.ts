import { Widget } from './widget.js'

export abstract class VElement<T extends Widget> {
  protected _node?: Node

  constructor(private _widget: T) {}

  /**
   * 获取真实元素
   */
  get el(): Node {
    if (!this._node) this._node = this.createNode()
    return this._node
  }

  /**
   * 获取小部件
   */
  get widget(): T {
    return this._widget
  }

  /**
   * 判断元素是否已挂载
   */
  get mounted(): boolean {
    return !!this._node
  }

  /**
   * 挂载元素
   *
   * @param parent
   */
  mount(parent: Node) {
    parent.appendChild(this.el)
  }

  protected abstract createNode(): Node
}
