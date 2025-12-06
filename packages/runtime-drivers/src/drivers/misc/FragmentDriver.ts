import type {
  AnyProps,
  ElementOf,
  FragmentNode,
  FragmentNodeType,
  HostNode
} from '@vitarx/runtime-core'
import { BaseHostNodeDriver, mixinContainerDriver } from '../base/index.js'

/**
 * 片段节点驱动器
 *
 * 用于管理 Fragment 类型的虚拟节点。
 * 继承自 BaseFragmentDriver，基类已通过 mixin 模式集成了容器驱动器功能。
 * Fragment 本身不渲染实际的 DOM 元素，仅作为子节点的逻辑容器。
 *
 * 核心功能：
 * - 创建片段元素（通过 HostRenderer）
 * - 管理子节点的渲染、挂载、激活、停用和卸载
 *
 * 使用示例：
 * ```typescript
 * const driver = new FragmentDriver();
 * // 驱动器会自动通过注册系统使用
 * ```
 */
export class FragmentDriver extends BaseHostNodeDriver<FragmentNodeType> {
  constructor() {
    super()
    // 混入容器驱动器功能，支持子节点处理
    mixinContainerDriver(this)
  }

  /**
   * @inheritDoc
   */
  protected override doUpdateProps(_node: HostNode<FragmentNodeType>, _newProps: AnyProps): void {
    // Fragment 不需要处理属性更新
    return
  }

  /**
   * @inheritDoc
   */
  protected override createElement(node: HostNode<FragmentNodeType>): ElementOf<FragmentNodeType> {
    return this.dom.createFragment(node as unknown as FragmentNode) as ElementOf<FragmentNodeType>
  }
}
