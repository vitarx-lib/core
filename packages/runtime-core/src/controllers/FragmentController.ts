import { useRenderer } from '../renderer/index.js'
import { type FragmentVNodeType, type HostFragmentElement, HostVNode } from '../types/index.js'
import { AnyProps } from '../types/widget.js'
import { mixinContainerController } from './ContainerController.js'
import { HostNodeController } from './HostNodeController.js'

/**
 * FragmentController 是一个用于管理虚拟节点片段的控制器类。
 * 它继承自 HostNodeController，专门处理 Fragment 类型的虚拟节点。
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
 * - 使用了 mixinContainerController 来混入容器控制器的功能
 * - 元素创建依赖于 useRenderer() 返回的渲染器实例
 */
export class FragmentController extends HostNodeController<FragmentVNodeType> {
  constructor() {
    super()
    mixinContainerController(this)
  }
  /** @inheritDoc */
  override updateProps(_node: HostVNode<FragmentVNodeType>, _newProps: AnyProps): void {
    return
  }
  /** @inheritDoc */
  protected createElement(): HostFragmentElement {
    return useRenderer().createFragment()
  }
}
