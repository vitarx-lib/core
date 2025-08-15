import type { RefSignal } from '@vitarx/responsive'
import { NoTagVNode } from './no-tag'
import { VNode } from './vnode'

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
   * 这是一个静态方法，并且重写了父类的实现
   * @param vnode - 需要检查的虚拟节点
   * @returns {boolean} 如果虚拟节点是文本节点则返回true，否则返回false
   */
  static override is(vnode: VNode): vnode is TextVNode {
    return vnode.type === 'text-node' // 通过检查节点的类型是否为text-node来判断
  }
}
