import { RefSignal } from '@vitarx/responsive'
import { NoTagVNode } from './no-tag.js'

/**
 * 表示一个注释节点的虚拟节点类，用于在DOM中创建和管理注释节点。
 * 该类继承自NoTagVNode，专门处理HTML注释节点的创建和渲染。
 *
 * 主要功能：
 * - 创建和管理DOM注释节点
 * - 支持静态字符串和响应式字符串作为注释内容
 * - 提供注释节点的类型检查功能
 *
 * @example
 * // 创建一个静态注释节点
 * const staticComment = new CommentVNode('This is a comment');
 *
 * // 创建一个响应式注释节点
 * const reactiveComment = new CommentVNode(ref('Dynamic comment'));
 *
 * @param value - 注释内容，可以是静态字符串或响应式字符串(RefSignal<string>)
 *
 * @extends NoTagVNode<'comment-node'>
 */
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
