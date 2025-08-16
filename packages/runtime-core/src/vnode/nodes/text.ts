import type { RefSignal } from '@vitarx/responsive'
import { NoTagVNode } from './no-tag'

export class TextVNode extends NoTagVNode<'text-node'> {
  /**
   * 运行时元素实例
   */
  #element: Text | null = null

  constructor(value: string | RefSignal<string>) {
    super('text-node', value)
  }

  /**
   * @inheritDoc
   */
  override get element(): Text {
    // 如果元素尚未渲染，则先进行渲染
    if (!this.#element) {
      this.#element = document.createTextNode(this.value)
    }
    return this.#element
  }

  /**
   * 检查给定的虚拟节点是否为文本节点
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果虚拟节点是文本节点则返回true，否则返回false
   */
  static override is(val: any): val is TextVNode {
    if (!super.is(val)) return false
    return val.type === 'text-node' // 通过检查节点的类型是否为text-node来判断
  }
}
