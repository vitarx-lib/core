import { RefSignal } from '@vitarx/responsive'
import { NoTagVNode } from './no-tag.js'

export class CommentVNode extends NoTagVNode<'comment-node'> {
  /**
   * 运行时元素实例
   */
  #element: Comment | null = null

  constructor(value: string | RefSignal<string>) {
    super('comment-node', value)
  }

  /**
   * @inheritDoc
   */
  override get element(): Comment {
    // 如果元素尚未渲染，则先进行渲染
    if (!this.#element) {
      this.#element = document.createComment(this.value)
    }
    return this.#element
  }
  /**
   * 判断给定的虚拟节点是否为注释节点
   *
   * @param val - 要检测的变量
   * @returns {boolean} 如果是注释节点则返回true，否则返回false
   */
  static override is(val: any): val is CommentVNode {
    if (!super.is(val)) return false
    return val.type === 'comment-node' // 通过检查节点的类型是否为text-node来判断
  }
}
