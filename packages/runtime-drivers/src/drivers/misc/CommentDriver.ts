import type { CommentNode, CommentNodeType, HostCommentElement } from '@vitarx/runtime-core'
import { BaseTextDriver } from '../base/BaseTextDriver.js'

/**
 * 注释节点驱动器
 *
 * 用于处理注释节点的创建和更新。
 * 继承自 BaseTextDriver，因为注释节点和文本节点有类似的更新逻辑。
 *
 * 核心功能：
 * - 将虚拟注释节点转换为实际的 DOM 注释元素
 * - 处理注释内容的更新
 *
 * 使用示例：
 * ```typescript
 * const driver = new CommentDriver();
 * // 驱动器会自动通过注册系统使用
 * ```
 */
export class CommentDriver extends BaseTextDriver<CommentNodeType> {
  /**
   * @inheritDoc
   */
  protected override createElement(node: CommentNode): HostCommentElement {
    return this.dom.createComment(node.props.text)
  }
}
