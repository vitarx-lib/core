import type { CommentNodeType, NodeElementType, ValidNodeProps } from '../../types/index.js'
import { NonElementNode } from '../base/index.js'
import { COMMENT_NODE_TYPE, NodeShapeFlags } from '../constants/index.js'

/**
 * 表示一个注释节点的虚拟节点类，用于在DOM中创建和管理注释节点。
 * 该类继承自NonElementNode，专门处理注释/锚点节点的创建和渲染。
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
 * @extends NonElementNode<COMMENT_NODE_TYPE>
 */
export class CommentNode extends NonElementNode<CommentNodeType> {
  public override shapeFlags = NodeShapeFlags.COMMENT
  constructor(props: ValidNodeProps<CommentNodeType>) {
    super(COMMENT_NODE_TYPE, props)
  }
  /**
   * @inheritDoc
   */
  protected override createElement(): NodeElementType<CommentNodeType> {
    return this.dom.createComment(String(this.value))
  }
}
