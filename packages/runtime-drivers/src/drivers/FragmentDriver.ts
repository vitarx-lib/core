import {
  AnyProps,
  type FragmentNode,
  type FragmentNodeType,
  getRenderer,
  type HostFragmentElement,
  HostNode
} from '@vitarx/runtime-core'
import { mixinContainerDriver } from './ContainerDriver.js'
import { HostNodeDriver } from './HostNodeDriver.js'

/**
 * FragmentDriver 是一个用于管理虚拟节点片段的驱动器类。
 * 它继承自 HostNodeDriver，专门处理 Fragment 类型的虚拟节点。
 *
 * 核心功能：
 * - 创建和管理片段元素（Fragment）
 * - 处理片段的属性更新（实际上不执行任何更新操作）
 *
 * 构造函数参数：
 * - 无参数
 *
 * 特殊说明：
 * - updateProps 方法被重写但实际不执行任何操作，因为 Fragment 不需要处理属性更新
 * - 使用了 mixinContainerDriver 来混入容器驱动器的功能
 * - 元素创建依赖于 getRenderer() 返回的渲染器实例
 */
export class FragmentDriver extends HostNodeDriver<FragmentNodeType> {
  constructor() {
    super()
    mixinContainerDriver(this)
  }
  /** @inheritDoc */
  override updateProps(_node: HostNode<FragmentNodeType>, _newProps: AnyProps): void {
    return
  }
  /** @inheritDoc */
  protected createElement(node: FragmentNode): HostFragmentElement {
    return getRenderer().createFragment(node)
  }
}
