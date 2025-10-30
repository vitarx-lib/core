import type { HostElementInstance, TextNodeType, VNodeInputProps } from '../../types/index.js'
import { NonElementNode } from '../base/index.js'
import { NodeShapeFlags, TEXT_NODE_TYPE } from '../constants/index.js'

/**
 * TextNode 是一个用于表示纯文本节点的虚拟节点类，继承自 NonElementNode。
 * 它主要用于在虚拟 DOM 中表示纯文本内容。
 *
 * 核心功能：
 * - 创建和管理文本节点的虚拟表示
 * - 支持静态字符串和响应式字符串值
 * - 提供文本节点的类型检查功能
 *
 * @example
 * ```jsx
 * function App() {
 *   const dynamicText = ref('Dynamic Text');
 *   return <div>
 *     <h1>Static Text</h1>
 *     <h1>{ dynamicText }</h1>
 *     <h1><plain-text value="plain-text" /></h1>
 *   </div>;
 * }
 * ```
 *
 * @param value - 文本内容，可以是静态字符串或响应式字符串（RefSignal<string>）
 *
 * @extends NonElementNode<TextNodeType>
 */
export class TextNode extends NonElementNode<TextNodeType> {
  public override shapeFlags = NodeShapeFlags.TEXT
  constructor(props: VNodeInputProps<TextNodeType>) {
    super(TEXT_NODE_TYPE, props)
  }

  /**
   * @inheritDoc
   */
  override render(): HostElementInstance<TextNodeType> {
    return this.dom.createText(this.value)
  }
}
