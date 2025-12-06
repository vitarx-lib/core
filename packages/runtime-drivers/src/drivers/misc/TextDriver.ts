import type { HostTextElement, TextNode, TextNodeType } from '@vitarx/runtime-core'
import { BaseTextDriver } from '../base/BaseTextDriver.js'

/**
 * 文本节点驱动器
 *
 * 用于处理文本节点的创建和更新。
 * 继承自 BaseTextDriver，提供文本节点的基础功能。
 *
 * 核心功能：
 * - 创建宿主环境中的文本节点
 * - 处理文本节点的值更新
 *
 * 使用示例：
 * ```typescript
 * const driver = new TextDriver();
 * // 驱动器会自动通过注册系统使用
 * ```
 */
export class TextDriver extends BaseTextDriver<TextNodeType> {
  /**
   * @inheritDoc
   */
  protected override createElement(node: TextNode): HostTextElement {
    return this.dom.createText(node.props.text)
  }
}
