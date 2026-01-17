import { createDepLink, destroyDepLink, isRef } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { getRenderer, withDirectives } from '../../runtime/index.js'
import { ViewState } from '../../shared/constants/viewState.js'
import { isView } from '../../shared/utils/is.js'
import type { DynamicView, HostNode, ParentView, TextView, View } from '../../types/index.js'
import { createAnchorView, createDynamicView, createTextView } from '../creator/index.js'
import { ViewInstance } from './base.js'
import type { WidgetInstance } from './widget.js'

/**
 * 标准化后的子节点类型
 * - view: 视图节点
 * - text: 文本节点
 * - empty: 空节点（占位符）
 */
type NormalizedChild =
  | { kind: 'view'; view: View }
  | { kind: 'text'; value: string }
  | { kind: 'empty' }

/**
 * 将任意输入标准化为 NormalizedChild
 * @param input - 输入值，可以是 View、Ref、字符串或其他类型
 * @returns 标准化后的子节点
 */
const normalizeDynamicChild = (input: any): NormalizedChild => {
  // 如果已经是视图，直接返回
  if (isView(input)) {
    return { kind: 'view', view: input }
  }

  // 如果是响应式引用，创建动态视图
  if (isRef(input)) {
    return { kind: 'view', view: createDynamicView(input) }
  }

  // 空值返回空节点
  if (input == null) {
    return { kind: 'empty' }
  }

  // 其他类型转为文本节点
  return { kind: 'text', value: String(input) }
}

/**
 * 将标准化节点实例化为实际视图
 * @param node - 标准化节点
 * @returns 实例化后的视图
 */
const materialize = (node: NormalizedChild): View => {
  switch (node.kind) {
    case 'view':
      return node.view
    case 'text':
      return createTextView(node.value)
    case 'empty':
      return createAnchorView('v-if')
  }
}

/**
 * 更新文本视图内容
 * @param view - 文本视图
 * @param value - 新的文本值
 */
const updateText = (view: TextView, value: string): void => {
  // 值未变化则直接返回
  if (view.text === value) return

  // 更新视图文本
  view.text = value
  const inst = view.instance

  // 视图未就绪则不更新 DOM
  if (!inst || inst.state < ViewState.READY) return

  // 更新 DOM 文本
  getRenderer().setText(inst.hostNode, value)
}

/**
 * 动态视图实例
 * 负责处理动态变化的子视图，支持视图、文本和空节点之间的切换
 */
export class DynamicInstance extends ViewInstance {
  /** 当前子节点类型 */
  private _kind: NormalizedChild['kind']

  /**
   * 构造函数
   * @param view - 动态视图定义
   * @param parent - 父视图
   * @param owner - 所属组件实例
   * @param app - 应用实例
   * @param replaceView - 视图替换方法
   */
  constructor(
    view: DynamicView,
    parent: ParentView | null,
    owner: WidgetInstance | null,
    app: App | null,
    private replaceView: (oldView: View, newView: View) => View
  ) {
    super(parent, owner, app)

    // 初始化子节点
    const initial = normalizeDynamicChild(view.child.value)
    this._kind = initial.kind
    this._child = materialize(initial)

    // 创建响应式更新效果
    const effect = () => {
      const next = normalizeDynamicChild(view.child.value)

      // 快速路径：同类更新
      if (next.kind === this._kind) {
        this._handleSameKindUpdate(next)
        return
      }

      // 慢速路径：结构变化
      this._handleStructureChange(view, next)
    }
    // 初始化运行副作用
    effect()
    // 建立依赖链接并执行初始效果
    const depLink = createDepLink(effect, view.child)
    // 清理函数
    this.cleanup = () => destroyDepLink(depLink)
  }

  /** 当前子视图 */
  private _child: View

  /** 获取当前子视图 */
  get child(): View {
    return this._child
  }

  /** 获取宿主节点（代理到子视图） */
  override get hostNode(): HostNode {
    if (this.state < ViewState.READY) {
      throw new Error('hostNode is not allocated')
    }
    return this.child.instance!.hostNode
  }

  /**
   * 处理同类更新（快速路径）
   * @param next - 下一个标准化子节点
   */
  private _handleSameKindUpdate(next: NormalizedChild): void {
    switch (next.kind) {
      case 'text':
        updateText(this._child as TextView, next.value)
        return

      case 'view':
        // 视图相同则无需更新
        if (next.view === this._child) return
        break

      case 'empty':
        // 空节点无需更新
        return
    }

    // 视图不同但类型相同，需要替换
    this._child = this.replaceView(this._child, next.view)
  }

  /**
   * 处理结构变化（慢速路径）
   * @param view - 动态视图定义
   * @param next - 下一个标准化子节点
   */
  private _handleStructureChange(view: DynamicView, next: NormalizedChild): void {
    const nextView = materialize(next)

    // 只在结构切换时透传指令
    if (view.directives) {
      withDirectives(nextView, Array.from(view.directives))
    }

    this._child = this.replaceView(this._child, nextView)
    this._kind = next.kind
  }
}
