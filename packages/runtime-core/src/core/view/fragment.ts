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

export class FragmentView extends BaseView<ViewKind.FRAGMENT> {
  public readonly kind = ViewKind.FRAGMENT
  public readonly children: ResolvedChildren
  public $node: HostFragment | null = null
  constructor(children: ValidChildren, key?: unknown, location?: CodeLocation) {
    super(key, location)
    this.children = resolveChildren(children)
  }
  protected override doInit(): void {
    for (const child of this.children) child.init(this.ctx)
  }
  protected override doDispose() {
    for (const child of this.children) child.dispose()
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
      this.$node = renderer.createFragment(this as any)
    }
    renderer[type](this.$node, containerOrAnchor)
    for (const child of this.children) child.mount(this.$node, 'append')
  }
}
