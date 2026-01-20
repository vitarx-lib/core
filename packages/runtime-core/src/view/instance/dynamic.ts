import { runEffect } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { getRenderer, withDirectives } from '../../runtime/index.js'
import type { ViewFlag } from '../../shared/constants/viewFlag.js'
import { ViewState } from '../../shared/constants/viewState.js'
import { isView } from '../../shared/utils/is.js'
import type { DynamicView, HostNode, ParentView, TextView, View } from '../../types/index.js'
import { createAnchorView, createTextView } from '../creator/index.js'
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
  if (!inst || inst.state < ViewState.RENDERED) return

  // 更新 DOM 文本
  getRenderer().setText(inst.hostNode, value)
}

/**
 * 动态视图实例
 */
export class DynamicInstance extends ViewInstance<ViewFlag.DYNAMIC> {
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
    super(view, parent, owner, app)

    // 初始化子节点
    const initial = normalizeDynamicChild(view.source.value)
    this._kind = initial.kind
    this._current = materialize(initial)

    // 清理函数
    this.cleanup = runEffect(
      () => {
        const next = normalizeDynamicChild(view.source.value)
        // 快速路径：同类更新
        if (this._kind === 'text' && next.kind === 'text') {
          updateText(this._current as TextView, next.value)
          return
        }
        // 快速路径：结构变化
        if (this._kind === 'empty' && next.kind === 'empty') return

        // 慢速路径：结构变化
        const nextView = materialize(next)
        if (nextView === this.current) return

        // 只在结构切换时透传指令
        if (view.directives) withDirectives(nextView, Array.from(view.directives))
        let handled = false
        if (owner && owner.root === view && owner.onViewSwitch) {
          const result = owner.onViewSwitch(nextView, this._current)
          if (result === false) handled = true
        }
        if (handled) {
          this._current = nextView
        } else {
          this._current = this.replaceView(this._current, nextView)
        }
        this._kind = next.kind
      },
      { flush: 'main', track: 'once' }
    )
  }

  /** 当前子视图 */
  private _current: View

  /** 获取当前子视图 */
  get current(): View {
    return this._current
  }

  /** 获取宿主节点（代理到子视图） */
  override get hostNode(): HostNode {
    if (this.state < ViewState.RENDERED) {
      throw new Error('hostNode is not allocated')
    }
    return this.current.instance!.hostNode
  }
}
