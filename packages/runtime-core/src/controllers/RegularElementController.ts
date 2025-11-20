import type {
  NodeElementType,
  RegularElementVNode,
  RegularElementVNodeType
} from '../types/index.js'
import { mixinContainerController } from './ContainerController.js'
import { ElementController } from './ElementController.js'

/**
 * RegularElementController 是一个用于管理常规 DOM 元素的控制器类。
 * 它继承自 ElementController，并负责创建和管理常规 HTML 和 SVG 元素。
 *
 * 核心功能：
 * - 创建常规 DOM 元素（HTML 或 SVG）
 * - 管理元素的生命周期
 *
 * 代码示例：
 * ```typescript
 * const controller = new RegularElementController();
 * const vnode = new RegularElementVNode('div', { class: 'container' });
 * const element = controller.createElement(vnode);
 * ```
 *
 * 构造函数：
 * - 无参数
 *
 * 特殊说明：
 * - 该类通过 mixinContainerController 混入了容器控制器的功能
 * - 创建元素时会根据 isSVGElement 标志决定创建 HTML 元素还是 SVG 元素
 */
export class RegularElementController extends ElementController<RegularElementVNodeType> {
  constructor() {
    super()
    mixinContainerController(this)
  }
  protected createElement<T extends RegularElementVNodeType>(
    node: RegularElementVNode<T>
  ): NodeElementType<T> {
    const isSVGElement = node.isSVGElement
    return this.dom[isSVGElement ? 'createElement' : 'createSVGElement'](node.type, node.props)
  }
}
