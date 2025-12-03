import {
  type CommentVNode,
  type CommentVNodeType,
  getRenderer,
  type HostCommentElement
} from '@vitarx/runtime-core'
import { NonElementDriver } from './NonElementDriver.js'

/**
 * CommentDriver 是一个专门用于处理注释节点的控制器类。
 * 它继承自 NonElementDriver，主要负责管理虚拟 DOM 中的注释节点（CommentNode）到实际 DOM 注释元素（HostCommentElement）的转换。
 *
 * 核心功能：
 * - 将虚拟注释节点转换为实际的 DOM 注释元素
 *
 * 构造函数参数：
 * - 继承自 NonElementDriver，无额外参数
 */
export class CommentDriver extends NonElementDriver<CommentVNodeType> {
  /** @inheritDoc */
  protected override createElement(node: CommentVNode): HostCommentElement {
    return getRenderer().createComment(node.props.value)
  }
}
