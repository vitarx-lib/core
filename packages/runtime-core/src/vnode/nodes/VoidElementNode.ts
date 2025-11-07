import { NodeShapeFlags } from '../../constants/index.js'
import type { VoidElementNodeType } from '../../types/index.js'
import { ElementNode } from '../core/ElementNode.js'

/**
 * VoidElementVNode 是一个用于表示自闭合 HTML 元素的虚拟节点类。
 * 它继承自 HostNode，专门处理如 `img、br、input` 等自闭合标签。
 *
 * 核心功能：
 * - 处理自闭合元素的创建和渲染
 * - 规范化元素的属性
 * - 维护元素的形状标志为 VOID_ELEMENT
 *
 * 示例：
 * ```typescript
 * const vnode = new VoidElementVNode('img', { src: 'image.jpg' })
 * ```
 *
 * 构造函数参数：
 * - type: 元素的类型，必须是 VoidElementNodeType 的子类型
 * - props: 元素的属性对象
 *
 * 特殊限制：
 * - 由于是自闭合元素，不能包含子节点
 */
export class VoidElementVNode<
  T extends VoidElementNodeType = VoidElementNodeType
> extends ElementNode<T> {
  public override shapeFlags = NodeShapeFlags.VOID_ELEMENT
}
