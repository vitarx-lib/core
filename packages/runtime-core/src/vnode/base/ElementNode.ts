import type { HostElementNames, NodeElementType, NodeNormalizedProps } from '../../types/index.js'
import { normalizeStyle } from '../utils/normalize.js'
import { HostNode } from './HostNode.js'

/**
 * ElementNode 是一个抽象的元素节点类，用于表示 DOM 元素节点。
 * 它继承自 HostNode，提供了创建和管理 DOM 元素的基本功能。
 *
 * 核心功能：
 * - 创建 DOM 元素（支持普通元素和 SVG 元素）
 * - 规范化元素属性
 * - 处理元素的显示状态
 *
 * 构造函数参数：
 * - type: 元素类型，如 'div'、'span' 等
 * - props: 元素的属性对象
 *
 * 特殊说明：
 * - 通过 isSVGElement 标志来区分普通元素和 SVG 元素
 * - 元素的显示状态可以通过 show 属性控制
 */
export abstract class ElementNode<
  T extends HostElementNames = HostElementNames
> extends HostNode<T> {
  /**
   * special flag for svg element
   */
  public isSVGElement: boolean = false
  /**
   * @inheritDoc
   */
  protected override createElement(): NodeElementType<T> {
    // 使用DOM操作创建指定类型和属性的元素
    const element = this.dom[this.isSVGElement ? 'createElement' : 'createSVGElement'](
      this.type,
      this.props
    )
    if (!this.show) this.dom.setDisplay(element, false)
    return element as NodeElementType<T>
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
  protected override handleShowState(visible: boolean): void {
    this.dom.setDisplay(this.element, visible)
  }
}
