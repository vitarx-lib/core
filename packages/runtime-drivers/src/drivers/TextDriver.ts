import type { HostTextElement, TextVNode, TextVNodeType } from '@vitarx/runtime-core'
import { NonElementDriver } from './NonElementDriver.js'

/**
 * TextDriver 是一个用于处理文本节点的驱动器类，继承自 NonElementDriver。
 * 主要用于在虚拟 DOM 中创建和管理文本节点。
 *
 * 核心功能：
 * - 创建宿主环境中的文本节点
 * - 处理文本节点的值更新
 *
 * @example
 * ```typescript
 * const driver = new TextDriver(dom);
 * const textNode = new TextVNode({ value: 'Hello World' });
 * const element = driver.createElement(textNode);
 * ```
 *
 * 构造函数参数：
 * - 通过继承的 NonElementDriver 接收 DOM 操作相关的配置
 *
 * 特殊说明：
 * - 该类专门用于处理文本节点，不适用于其他类型的节点
 * - 文本节点的值更新会直接修改 DOM，可能触发浏览器的重绘
 */
export class TextDriver extends NonElementDriver<TextVNodeType> {
  protected override createElement(node: TextVNode): HostTextElement {
    return this.dom.createText(node.props.text)
  }
}
