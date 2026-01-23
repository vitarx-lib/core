import { type Ref } from '@vitarx/responsive'
import { ComponentInstance } from '../../runtime/index.js'
import { ViewKind } from '../../shared/constants/viewFlag.js'
import type {
  CodeLocation,
  Component,
  ComponentProps,
  DirectiveMap,
  HostContainer,
  HostNode,
  MountType,
  View
} from '../../types/index.js'
import { resolveProps } from '../compiler/utils.js'
import { BaseView } from './base.js'

export class ComponentView<T extends Component = Component> extends BaseView<ViewKind.COMPONENT> {
  /** @internal 类型标识 */
  public readonly kind = ViewKind.COMPONENT
  /** @internal 引用组件公开实例 */
  public readonly ref: Ref | undefined
  /** @internal 组件实体函数 */
  public readonly component: T
  /** @internal 传递给组件的参数 */
  public readonly props: ComponentProps<T> | null
  /** @internal 指令映射表 */
  public directives?: DirectiveMap
  /** @internal 组件运行时实例 */
  public instance: ComponentInstance<T> | null = null
  constructor(
    component: T,
    props: ComponentProps<T> | null,
    key?: unknown,
    location?: CodeLocation
  ) {
    super(key, location)
    this.component = component
    const { props: resolvedProps, ref } = resolveProps(props)
    this.ref = ref
    this.props = resolvedProps
  }
  get $node(): HostNode | null {
    return this.instance?.subView.$node ?? null
  }

  get subView(): View | null {
    return this.instance?.subView ?? null
  }
  protected override doInit(): void {
    this.instance = new ComponentInstance<T>(this)
    this.instance.prepare()
    this.instance.subView.init({ owner: this.instance, app: this.app })
  }
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType) {
    if (this.ref) this.ref.value = this.instance!.publicInstance
    this.subView!.mount(containerOrAnchor, type)
    this.instance!.mounted()
  }
  protected override doDispose(): void {
    this.subView!.dispose()
    this.instance!.dispose()
    this.instance = null
  }
}
