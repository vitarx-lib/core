import { useRenderer } from '../renderer/index.js'
import type { CommentVNode, CommentVNodeType, HostCommentElement } from '../types/index.js'
import { NonElementController } from './NonElementController.js'

/**
 * CommentController 是一个专门用于处理注释节点的控制器类。
 * 它继承自 NonElementController，主要负责管理虚拟 DOM 中的注释节点（CommentNode）到实际 DOM 注释元素（HostCommentElement）的转换。
 *
 * 核心功能：
 * - 将虚拟注释节点转换为实际的 DOM 注释元素
 *
 * 构造函数参数：
 * - 继承自 NonElementController，无额外参数
 */
export class CommentController extends NonElementController<CommentVNodeType> {
  /** @inheritDoc */
  protected override createElement(node: CommentVNode): HostCommentElement {
    return useRenderer().createComment(node.props.value)
  }
}
