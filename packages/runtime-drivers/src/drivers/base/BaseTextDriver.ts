import type { AnyProps, HostNode, NonElementNodeType } from '@vitarx/runtime-core'
import { BaseHostNodeDriver } from './BaseHostNodeDriver.js'

/**
 * 文本类节点驱动器抽象基类
 *
 * 用于管理文本节点和注释节点等非元素类型节点的更新和渲染。
 * 提供统一的文本内容更新逻辑。
 *
 * 核心功能：
 * - 文本内容的更新和同步
 * - 与 HostRenderer 交互处理文本节点
 *
 * @template T - 非元素节点类型，继承自 NonElementNodeType
 */
export abstract class BaseTextDriver<T extends NonElementNodeType> extends BaseHostNodeDriver<T> {
  /**
   * @inheritDoc
   */
  protected override doUpdateProps(node: HostNode<T>, newProps: AnyProps): void {
    const oldProps = node.props
    if (oldProps.text !== newProps.text) {
      oldProps.text = newProps.text
      this.dom.setText(node.el!, newProps.text)
    }
  }
}
