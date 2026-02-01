import { type Ref } from '@vitarx/responsive'
import { ViewKind } from '../../constants/index.js'
import { viewEffect, type ViewEffect } from '../../runtime/effect.js'
import { replaceView, withDirectives } from '../../runtime/index.js'
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
  if (input == null || typeof input === 'boolean') {
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
/**
 * DynamicView 用于根据响应式数据的变化来动态渲染不同的视图。
 *
 * 核心功能：
 * - 监听响应式数据源的变化，自动更新视图
 * - 支持视图的快速路径更新（同类型视图）和慢路径更新（结构变化）
 * - 提供视图切换的钩子函数，允许父级接管视图切换逻辑
 * - 支持指令透传
 *
 * 使用示例：
 * ```typescript
 * const source = ref('text')
 * const view = new DynamicView(source)
 * ```
 *
 * 构造函数参数：
 * @param source - 响应式数据源，用于决定当前渲染的视图
 * @param location - 可选，代码位置信息，用于调试
 *
 * 使用限制：
 * - 必须在初始化后才能访问 current 属性
 * - 视图切换时，如果所属组件提供了 onViewSwitch 钩子，必须确保返回的视图状态匹配
 *
 * 潜在副作用：
 * - 视图切换可能会触发 DOM 操作
 * - 如果 onViewSwitch 钩子返回的视图状态不匹配，会抛出错误
 */
export class DynamicView<T = any> extends BaseView<ViewKind.DYNAMIC, HostNode> {
  public readonly kind = ViewKind.DYNAMIC
  /** @internal 视图来源 */
  public readonly source: Ref<T>
  /** @internal 指令映射表 */
  public directives?: DirectiveMap
  /** @internal 缓存的视图 */
  protected cachedView: View | null = null
  /** @private 切换副作用 */
  private effect?: ViewEffect
  /** @private 缓存当前视图的类型 */
  private cachedType: NormalizedChild['type'] | null = null
  private cachedValue: T | null = null
  constructor(source: Ref, location?: CodeLocation) {
    super(location)
    this.source = source
  }
  get current(): View | null {
    return this.cachedView
  }
  protected get hostNode(): HostNode | null {
    return this.cachedView?.node ?? null
  }

  protected override doInit(): void {
    let handler: (value: T) => void = this.initView.bind(this)
    const effect = viewEffect(() => {
      try {
        handler(this.source.value)
      } catch (err) {
        if (!this.cachedView) {
          this.cachedView = new CommentView(`DynamicView Error: init failed`)
        }
        if (this.owner) {
          this.owner.reportError(err, 'view:switch')
        } else {
          throw err
        }
      }
    })
    if (effect) {
      this.effect = effect
      handler = this.updateView.bind(this)
    }
    this.cachedView!.init(this.ctx)
  }

  private initView(value: T): void {
    const normalized = normalizeDynamicChild(value)
    const view = materialize(normalized)
    if (this.directives) withDirectives(view, Array.from(this.directives))
    this.cachedType = normalized.type
    this.cachedView = view
    this.cachedValue = value
  }
  protected override doActivate(): void {
    this.cachedView!.activate()
    this.effect?.resume()
  }
  protected override doDeactivate(): void {
    this.effect?.pause()
    this.cachedView!.deactivate()
  }
  protected override doDispose(): void {
    this.effect?.dispose()
    this.cachedView!.dispose()
    this.cachedView = null
    this.cachedType = null
  }
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    this.cachedView!.mount(containerOrAnchor, type)
  }

  private updateView(value: T): void {
    if (this.cachedValue === value) return
    this.cachedValue = value
    const normalized = normalizeDynamicChild(value)
    const prevView = this.cachedView!
    const prevType = this.cachedType!

    // 快路径：同类型、可就地更新
    if (prevType === normalized.type) {
      switch (normalized.type) {
        case 'text':
          ;(prevView as TextView).text = normalized.value
          return

        case 'empty':
          return

        default:
          // 组件 / 元素：完全相同引用，无需处理
          if (normalized.view === prevView) return
      }
    }

    // 慢路径：结构变化，构造候选 View
    const nextView = materialize(normalized)

    // 结构切换透传指令
    if (this.directives) {
      withDirectives(nextView, Array.from(this.directives))
    }
    const owner = this.owner
    // 允许父级接管视图切换
    if (owner?.subView === this && owner.onViewSwitch) {
      const result = owner.onViewSwitch(prevView, nextView)
      if (isView(result)) {
        if (result.state !== this.state) {
          throw new Error(
            '[SwitchView]: View state mismatch detected: ' +
              `Expected view state ${this.state}, but received ${result.state}. ` +
              'This error occurs when a custom onViewSwitch handler returns a view with a different state ' +
              'than the one being switched to. Ensure the returned view state matches the expected state.'
          )
        }
        this.cachedView = result
        this.cachedType = result === nextView ? normalized.type : 'view'
        return
      }
    }
    replaceView(prevView, nextView)
    this.cachedView = nextView
    this.cachedType = normalized.type
  }
}
