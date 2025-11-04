import { unref } from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils'
import type {
  RegularElementNodeType,
  RuntimeVNodeChildren,
  VNodeInputProps
} from '../../types/index.js'
import { type ContainerNode, ElementNode, mixinContainerNode } from '../base/index.js'
import { NodeShapeFlags } from '../constants/index.js'
import { normalizeChildren } from '../utils/normalize.js'

/**
 * RegularElementNode 是一个用于表示虚拟DOM中元素节点的类。
 * 它继承自 ElementNode，提供了元素节点的基础功能。
 *
 * 主要功能：
 * - 处理元素的显示/隐藏状态
 * - 规范化元素的属性
 * - 创建实际的DOM元素实例
 *
 * @template T - 元素节点类型，默认为 RegularElementNodeType
 *
 * @extends ElementNode<T>
 *
 * @note
 * - 此类主要用于框架内部的虚拟DOM实现
 * - 不应直接实例化，而是通过框架的创建函数来使用
 * - 元素的属性会被自动规范化处理
 */
export class RegularElementNode<T extends RegularElementNodeType = RegularElementNodeType>
  extends ElementNode<T>
  implements ContainerNode
{
  public override shapeFlags = NodeShapeFlags.REGULAR_ELEMENT
  /**
   * 子节点列表
   */
  public children: RuntimeVNodeChildren

  constructor(type: T, props: VNodeInputProps<T>) {
    const hasChildren = 'children' in props
    const children = hasChildren ? unref(popProperty(props, 'children')) : undefined
    super(type, props)
    // 如果存在children属性，则格式化子节点 // TODO 递归完善 svg
    this.children = hasChildren ? normalizeChildren(children, this) : []
    mixinContainerNode(this)
  }
}
