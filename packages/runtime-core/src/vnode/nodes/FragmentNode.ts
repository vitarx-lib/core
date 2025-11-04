import type { FragmentNodeType, NodeElementType, VNodeInputProps } from '../../types/index.js'
import { ContainerNode } from '../base/index.js'
import { FRAGMENT_NODE_TYPE, NodeShapeFlags } from '../constants/index.js'

/**
 * FragmentNode是一个容器节点类，用于管理文档片段(Fragment)的子节点。
 * 该类继承自ContainerNode，专门用于处理文档片段的显示状态和DOM元素的创建。
 *
 * 核心功能：
 * - 管理文档片段的子节点显示状态
 * - 创建和管理文档片段的DOM元素
 *
 * 注意事项：
 * - 子节点的显示状态会随父节点同步变化
 * - 创建的文档片段不会直接显示在DOM中，需要通过父节点插入
 */
export class FragmentNode extends ContainerNode<FragmentNodeType> {
  public override shapeFlags = NodeShapeFlags.FRAGMENT

  constructor(props: VNodeInputProps<FragmentNodeType>) {
    super(FRAGMENT_NODE_TYPE, props)
  }
  /**
   * @inheritDoc
   */
  protected override createElement(): NodeElementType<FragmentNodeType> {
    return this.dom.createFragment() // 调用dom对象的createFragment方法创建文档片段
  }
}
