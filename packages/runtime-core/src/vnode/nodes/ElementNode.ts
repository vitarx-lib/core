import type {
  ElementNodeType,
  HostElementInstance,
  NodeNormalizedProps
} from '../../types/index.js'
import { ContainerNode } from '../base/index.js'
import { NodeShapeFlags } from '../constants/index.js'
import { normalizeStyle } from '../utils/normalizeProps.js'

/**
 * ElementVNode 是一个用于表示虚拟DOM中元素节点的类。它继承自 ContainerNode，提供了元素节点的基础功能。
 *
 * 主要功能：
 * - 处理元素的显示/隐藏状态
 * - 规范化元素的属性
 * - 创建实际的DOM元素实例
 *
 * @template T - 元素节点类型，默认为 ElementNodeType
 *
 * @example
 * ```typescript
 * // 创建一个元素节点
 * const vnode = new ElementVNode('div', { class: 'container' })
 * ```
 *
 * @extends ContainerNode<T>
 *
 * @note
 * - 此类主要用于框架内部的虚拟DOM实现
 * - 不应直接实例化，而是通过框架的创建函数来使用
 * - 元素的属性会被自动规范化处理
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
