import { useRenderer } from '../renderer/index.js'
import type { NodeElementType, VoidElementVNode, VoidElementVNodeType } from '../types/index.js'
import { NonElementController } from './NonElementController.js'

/**
 * VoidElementController 是一个专门用于处理虚拟空元素（void elements）的控制器类。
 * 它继承自 NonElementController，主要负责创建和管理不需要子节点的 HTML 元素，
 * 如 <img>、<br>、<input> 等自闭合标签。
 *
 * 核心功能：
 * - 创建和管理空元素节点
 * - 处理空元素的属性和配置
 *
 * 代码示例：
 * ```typescript
 * const controller = new VoidElementController();
 * const element = controller.createElement({
 *   type: 'img',
 *   props: { src: 'image.jpg' }
 * });
 * ```
 *
 * 构造函数参数：
 * 该类没有显式定义构造函数参数，使用默认构造函数。
 *
 * 使用限制：
 * - 仅适用于处理空元素（void elements）
 * - 不支持包含子节点的元素
 * - 创建的元素类型必须符合 VoidElementVNodeType 接口规范
 */
export class VoidElementController extends NonElementController<VoidElementVNodeType> {
  protected createElement<T extends VoidElementVNodeType>(
    node: VoidElementVNode<T>
  ): NodeElementType<T> {
    return useRenderer().createElement(node.type, node.props)
  }
}
