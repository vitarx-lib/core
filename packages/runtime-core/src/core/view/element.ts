import { popProperty } from '@vitarx/utils'
import { ViewKind } from '../../constants/index.js'
import { viewEffect, type ViewEffect } from '../../runtime/effect.js'
import { applyDirective, getRenderer } from '../../runtime/index.js'
import type {
  AnyProps,
  CodeLocation,
  DirectiveMap,
  ElementProps,
  HostContainer,
  HostElement,
  HostElementTag,
  HostNode,
  InstanceRef,
  IntrinsicElements,
  MountType,
  ResolvedChildren,
  ViewRenderer
} from '../../types/index.js'
import { applyRef, resolveChildren, resolveProps } from '../compiler/resolve.js'
import { BaseView } from './base.js'

export class ElementView<
  T extends HostElementTag = HostElementTag
> extends BaseView<ViewKind.ELEMENT> {
  readonly kind = ViewKind.ELEMENT
  public $node: HostElement<T> | null = null
  public readonly tag: T
  public readonly props: ElementProps<T> | null
  public readonly children: BaseView<any>[]
  public readonly ref: InstanceRef | undefined
  /** @internal 指令映射表 */
  public directives?: DirectiveMap
  private effects: ViewEffect[] | null = null

  constructor(tag: T, props: IntrinsicElements[T] | null = null, location?: CodeLocation) {
    super(location)
    this.tag = tag
    let resolvedChildren: ResolvedChildren // 声明一个已解析子元素的变量
    // 检查props是否存在且包含children属性
    if (props && 'children' in props) {
      const propChildren = popProperty(props, 'children') // 从props中移除并获取children属性
      resolvedChildren = resolveChildren(propChildren as any) // 解析子元素
    } else {
      resolvedChildren = [] // 如果没有子元素，设置为空数组
    }
    this.children = resolvedChildren
    const { props: resolvedProps, ref } = resolveProps(props)
    this.props = resolvedProps
    if (ref) this.ref = ref
  }
  protected override doInit(): void {
    for (const child of this.children) child.init(this.ctx)
  }
  protected override doActivate(): void {
    for (const child of this.children) child.activate()
    if (this.effects) {
      for (const effect of this.effects) effect.resume()
    }
  }
  protected override doDeactivate(): void {
    if (this.effects) {
      for (const effect of this.effects) effect.pause()
    }
    for (const child of this.children) child.deactivate()
  }
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.$node) {
      // 判断是否为svg命名空间
      const svg = this.tag === 'svg' || renderer.isSVGElement(containerOrAnchor)
      this.$node = renderer.createElement(this.tag, svg)
    }
    if (this.props) this.setProps(this.$node, this.props, renderer)
    if (this.ref) applyRef(this.ref, this.$node)
    applyDirective(this, this.$node, 'created')
    renderer[type](this.$node, containerOrAnchor)
    for (const child of this.children) child.mount(this.$node, 'append')
    applyDirective(this, this.$node, 'mounted')
  }
  protected override doDispose(): void {
    if (this.effects) {
      for (const effect of this.effects) effect()
      this.effects = null
    }
    for (const child of this.children) child.dispose()
    if (this.$node) {
      applyDirective(this, this.$node, 'dispose')
      getRenderer().remove(this.$node)
    }
  }
  private setProps(node: HostElement, props: AnyProps, renderer: ViewRenderer): void {
    const effects: ViewEffect[] = []
    for (const key in props) {
      let prevHandler: any = null
      const stop = viewEffect(() => {
        // getter 在 effect 中执行，建立依赖
        const value = props[key]
        // 执行真实副作用
        renderer.setAttribute(node, key, value, prevHandler)
        // 事件处理器缓存
        prevHandler = typeof value === 'function' ? value : null
      })
      if (stop) effects.push(stop)
    }
    if (effects.length) this.effects = effects
  }
}
