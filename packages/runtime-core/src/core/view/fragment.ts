import { ViewKind } from '../../constants/index.js'
import { getRenderer } from '../../runtime/index.js'
import type {
  CodeLocation,
  HostContainer,
  HostFragment,
  HostNode,
  MountType,
  ResolvedChildren,
  ValidChildren
} from '../../types/index.js'
import { resolveChildren } from '../compiler/resolve.js'
import { BaseView } from './base.js'

/**
 * FragmentView 类用于表示一个片段视图，它是 BaseView 的子类，专门用于管理一组子视图的容器。
 * 该类负责子视图的初始化、挂载、激活、停用和销毁等生命周期管理。
 *
 * 核心功能：
 * - 管理子视图的生命周期（初始化、挂载、激活、停用、销毁）
 * - 提供对子视图的统一管理接口
 *
 * 使用示例：
 * ```typescript
 * const fragment = new FragmentView([childView1, childView2]);
 * fragment.init(context);
 * fragment.mount(container, 'append');
 * ```
 *
 * 构造函数参数：
 * - children: ValidChildren - 子视图数组，可以是单个视图或视图数组
 * - location?: CodeLocation - 可选的代码位置信息，用于调试和错误追踪
 *
 * 特殊说明：
 * - 该类会自动创建一个宿主片段节点（HostFragment）用于挂载子视图
 * - 子视图的生命周期方法会按照顺序依次调用
 * - 不建议直接实例化该类，通常通过视图系统自动创建
 */
export class FragmentView extends BaseView<ViewKind.FRAGMENT> {
  public readonly kind = ViewKind.FRAGMENT
  public readonly children: ResolvedChildren
  public $node: HostFragment | null = null
  constructor(children: ValidChildren, location?: CodeLocation) {
    super(location)
    this.children = resolveChildren(children)
  }
  protected override doInit(): void {
    for (const child of this.children) child.init(this.ctx)
  }
  protected override doDispose() {
    for (const child of this.children) child.dispose()
    if (this.$node) getRenderer().remove(this.$node)
  }
  protected override doActivate(): void {
    for (const child of this.children) child.activate()
  }
  protected override doDeactivate(): void {
    for (const child of this.children) child.deactivate()
  }
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.$node) {
      // 判断是否为svg命名空间
      this.$node = renderer.createFragment(this)
    }
    for (const child of this.children) child.mount(this.$node, 'append')
  }
}
