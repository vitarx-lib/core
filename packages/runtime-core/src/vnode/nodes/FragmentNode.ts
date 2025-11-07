import { unref } from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils'
import { FRAGMENT_NODE_TYPE, NodeShapeFlags } from '../../constants/index.js'
import type {
  FragmentNodeType,
  NodeElementType,
  ValidNodeProps,
  VNodeNormalizedChildren
} from '../../types/index.js'
import { type ContainerNode, mixinContainerNode, normalizeChildren } from '../core/ContainerNode.js'
import { HostNode } from '../core/HostNode.js'

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
export class FragmentNode extends HostNode<FragmentNodeType> implements ContainerNode {
  public override shapeFlags = NodeShapeFlags.FRAGMENT
  /**
   * 子节点列表
   */
  public children: VNodeNormalizedChildren
  constructor(props: ValidNodeProps<FragmentNodeType>) {
    const hasChildren = 'children' in props
    const children = hasChildren ? unref(popProperty(props, 'children')) : undefined
    super(FRAGMENT_NODE_TYPE, props)
    // 如果存在children属性，则格式化子节点
    this.children = hasChildren ? normalizeChildren(children, this) : []
    mixinContainerNode(this)
  }
  /**
   * @inheritDoc
   */
  protected override createElement(): NodeElementType<FragmentNodeType> {
    return this.dom.createFragment() // 调用dom对象的createFragment方法创建文档片段
  }
}
