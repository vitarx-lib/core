import type {
  ElementNodeType,
  HostElementInstance,
  NodeNormalizedProps
} from '../../types/index.js'
import { ContainerNode } from '../base/index.js'
import { NodeShapeFlags } from '../constants/index.js'
import { normalizeStyle } from '../utils/normalizeProps.js'

/**
 * ElementVNode 是一个用于表示 DOM 元素的虚拟节点类，继承自 ContainerNode。
 * 它负责管理 DOM 元素的创建、属性处理和显示状态控制。
 *
 * 核心功能：
 * - 创建和管理 DOM 元素实例
 * - 处理元素的显示/隐藏状态
 * - 规范化和处理元素属性
 *
 * @example
 * ```typescript
 * const vnode = new ElementVNode('div', { class: 'container' });
 * vnode.mount(document.body);
 * ```
 *
 * @template T - 元素节点类型，默认为 ElementNodeType
 *
 * @extends ContainerNode<T>
 */
export class ElementVNode<T extends ElementNodeType = ElementNodeType> extends ContainerNode<T> {
  public override shapeFlags = NodeShapeFlags.ELEMENT
  /**
   * @inheritDoc
   */
  protected override handleShowState(is: boolean): void {
    // 如果显示，则恢复style样式，如果没有则恢复为空
    this.dom.setDisplay(this.element, is)
  }
  /**
   * @inheritDoc
   */
  protected override normalizeProps(props: Record<string, any>): NodeNormalizedProps<T> {
    return normalizeStyle(super.normalizeProps(props))
  }
  /**
   * @inheritDoc
   */
  protected createElement(): HostElementInstance<T> {
    return this.dom.createElement(this.type, this.props)
  }
}
