import type { AnyProps, HostNode, NonElementNodeType } from '@vitarx/runtime-core'
import { HostNodeDriver } from './HostNodeDriver.js'

/**
 * 非元素节点驱动器基类，用于管理非元素类型的虚拟节点。
 * 继承自 HostNodeDriver，专门处理文本节点等非元素类型节点的更新和渲染。
 *
 * 核心功能：
 * - 更新节点属性（主要是文本内容）
 * - 维护虚拟节点与DOM节点的同步
 *
 * 代码示例：
 * ```typescript
 * class TextDriver extends NonElementDriver<TextVNode> {
 *   // 实现具体的文本节点控制逻辑
 * }
 * ```
 *
 * 构造函数参数：
 * - 通过泛型 T 指定具体的非元素节点类型
 *
 * 特殊说明：
 * - 该类为抽象类，需要被继承使用
 * - 主要处理文本节点的属性更新，通过 updateProps 方法实现
 * - 直接操作 DOM 文本内容，需要注意性能影响
 * - 依赖 HostNodeDriver 提供的基础功能
 */
export abstract class NonElementDriver<T extends NonElementNodeType> extends HostNodeDriver<T> {
  override updateProps(node: HostNode<T>, newProps: AnyProps): void {
    const oldProps = node.props
    if (oldProps.text !== newProps.text) {
      oldProps.text = newProps.text
      this.dom.setText(node.el!, newProps.text)
    }
  }
}
