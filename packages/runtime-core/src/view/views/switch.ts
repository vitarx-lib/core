import { onScopeDispose, type Ref, runEffect } from '@vitarx/responsive'
import { withDirectives } from '../../runtime/index.js'
import { ViewKind } from '../../shared/constants/viewFlag.js'
import { isView } from '../../shared/index.js'
import type {
  CodeLocation,
  DirectiveMap,
  HostContainer,
  HostNode,
  MountType,
  View
} from '../../types/index.js'
import { CommentView, TextView } from './atomic.js'
import { BaseView } from './base.js'

/**
 * 标准化后的子节点类型
 * - view: 视图节点
 * - text: 文本节点
 * - empty: 空节点（占位符）
 */
type NormalizedChild =
  | { type: 'view'; view: View }
  | { type: 'text'; value: string }
  | { type: 'empty' }

/**
 * 将任意输入标准化为 NormalizedChild
 * @param input - 输入值，可以是 View、Ref、字符串或其他类型
 * @returns 标准化后的子节点
 */
const normalizeDynamicChild = (input: any): NormalizedChild => {
  // 如果已经是视图，直接返回
  if (isView(input)) {
    return { type: 'view', view: input }
  }
  // 空值返回空节点
  if (input == null) {
    return { type: 'empty' }
  }
  const str = String(input)
  // 空字符串不能渲染为文本
  if (str.length === 0) return { type: 'empty' }
  // 其他类型转为文本节点
  return { type: 'text', value: String(input) }
}

/**
 * 将标准化节点实例化为实际视图
 * @param node - 标准化节点
 * @returns 实例化后的视图
 */
const materialize = (node: NormalizedChild): View => {
  switch (node.type) {
    case 'view':
      return node.view
    case 'text':
      return new TextView(node.value)
    case 'empty':
      return new CommentView('v-if')
  }
}

export class SwitchView<T = any> extends BaseView<ViewKind.SWITCH> {
  public readonly kind = ViewKind.SWITCH
  /** @internal 视图来源 */
  public readonly source: Ref<T>
  /** @internal 指令映射表 */
  public directives?: DirectiveMap
  private cachedView!: View
  private cachedType!: NormalizedChild['type']

  constructor(source: Ref, key?: unknown, location?: CodeLocation) {
    super(key, location)
    this.source = source
    // 清理函数
    const stop = runEffect(
      () => {
        const value = this.source.value
        this.updateDerivedView(value)
      },
      { flush: 'main', track: 'once' }
    )
    if (stop) onScopeDispose(stop, true)
  }
  /**
   * 获取当前视图
   *
   * @returns {View} 返回当前缓存的视图实例
   */
  get current(): View {
    return this.cachedView
  }
  get $node(): HostNode | null {
    return this.cachedView.$node
  }
  protected override doInit(): void {
    this.cachedView.init(this.ctx)
  }
  protected override doDispose(): void {
    this.cachedView.dispose()
  }
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    this.cachedView.mount(containerOrAnchor, type)
  }
  private updateDerivedView(value: unknown): void {
    const normalize = normalizeDynamicChild(value)
    if (!this.cachedView) {
      this.cachedType = normalize.type
      this.cachedView = materialize(normalize)
      return
    }
    if (this.cachedType === normalize.type) {
      switch (normalize.type) {
        case 'text':
          ;(this.cachedView as TextView).text = normalize.value
          return
        case 'empty':
          return
        default:
          if (this.cachedView === normalize.view) return
      }
    }
    // 慢速路径：结构变化
    const nextView = materialize(normalize)
    // 只在结构切换时透传指令
    if (this.directives) withDirectives(nextView, Array.from(this.directives))
    let handled = false
    const owner = this.owner
    if (owner && owner.subView === this && owner.onViewSwitch) {
      const result = owner.onViewSwitch(nextView, this.cachedView)
      if (result === false) handled = true
    }
    if (!handled) {
      // TODO 最后再补齐切换视图逻辑
      // replaceView(this.cachedView, nextView)
    }
    this.cachedView = nextView
    this.cachedType = normalize.type
  }
}
