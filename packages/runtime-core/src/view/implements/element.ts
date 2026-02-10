import { popProperty } from '@vitarx/utils'
import { ViewKind } from '../../constants/index.js'
import { viewEffect, type ViewEffect } from '../../runtime/effect.js'
import { applyDirective, getRenderer } from '../../runtime/index.js'
import type {
  AnyProps,
  CodeLocation,
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

/**
 * ElementView 类用于表示和管理 DOM 元素视图，支持属性、子元素、指令和引用等功能。
 *
 * 核心功能：
 * - 创建和管理 DOM 元素节点
 * - 处理元素属性和子元素
 * - 支持指令（directives）和引用（ref）
 * - 管理视图的生命周期（初始化、挂载、激活、停用、销毁）
 *
 * @example
 * ```typescript
 * const elementView = new ElementView('div', { class: 'container', children: [new TextView('Hello')] })
 * elementView.init(ctx)
 * elementView.mount(document.body, 'append')
 * ```
 *
 * @template T - 扩展自 HostElementTag，表示 DOM 元素的标签名
 *
 * @constructor
 * @param {T} tag - DOM 元素的标签名（如 'div', 'span' 等）
 * @param {IntrinsicElements[T] | null} [props=null] - 元素的属性对象，包括事件处理器、样式、类名等
 * @param {CodeLocation} [location] - 可选的代码位置信息，用于调试
 *
 * @remarks
 * - 内部使用 directives 属性来管理指令映射表
 * - effects 属性用于管理视图的副作用，会在视图销毁时自动清理
 * - $node 属性在挂载前为 null，挂载后会引用实际的 DOM 节点
 */
export class ElementView<T extends HostElementTag = HostElementTag> extends BaseView<
  ViewKind.ELEMENT,
  HostElement<T>
> {
  public readonly kind = ViewKind.ELEMENT
  protected hostNode: HostElement<T> | null = null
  /** 元素标签 */
  public readonly tag: T
  /** 元素属性 */
  public readonly props: AnyProps | null
  /** 子视图列表 */
  public readonly children: ResolvedChildren
  /** 元素引用 */
  public readonly ref: InstanceRef | undefined
  /** 指令映射表 */
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
    if (!this.hostNode) {
      // 判断是否为svg命名空间
      const svg = this.tag === 'svg' || renderer.isSVGElement(containerOrAnchor)
      this.hostNode = renderer.createElement(this.tag, svg)
    }
    if (this.props) this.setProps(this.hostNode, this.props, renderer)
    if (this.ref) applyRef(this.ref, this.hostNode)
    applyDirective(this, this.hostNode, 'created')
    renderer[type](this.hostNode, containerOrAnchor)
    for (const child of this.children) child.mount(this.hostNode, 'append')
    applyDirective(this, this.hostNode, 'mounted')
  }
  protected override doDispose(): void {
    if (this.effects) {
      for (const effect of this.effects) effect.dispose()
      this.effects = null
    }
    if (this.hostNode) applyDirective(this, this.hostNode, 'dispose')
    for (const child of this.children) child.dispose()
    if (this.hostNode) {
      getRenderer().remove(this.hostNode)
      this.hostNode = null
    }
  }
  private setProps(node: HostElement, props: AnyProps, renderer: ViewRenderer): void {
    const effects: ViewEffect[] = []
    for (const key in props) {
      let prevHandler: any = null
      const effect = viewEffect(() => {
        try {
          // getter 执行，建立依赖
          const value = props[key]
          renderer.setAttribute(node, key, value, prevHandler)
          // 缓存事件处理器
          prevHandler = typeof value === 'function' ? value : null
        } catch (err) {
          if (this.owner) {
            this.owner.reportError(err, `view:update`)
          } else {
            throw err
          }
        }
      })
      if (effect) effects.push(effect)
    }
    if (effects.length) this.effects = effects
  }
}
