import { ViewKind } from '../../constants/index.js'
import { getRenderer } from '../../runtime/index.js'
import type {
  CodeLocation,
  HostComment,
  HostContainer,
  HostNode,
  HostText,
  MountType,
  ViewRenderer
} from '../../types/index.js'
import { BaseView } from './base.js'

abstract class BaseAtomicView<
  Kind extends ViewKind.TEXT | ViewKind.COMMENT,
  Node extends HostText | HostComment
> extends BaseView<Kind, Node> {
  protected override hostNode: Node | null = null

  constructor(text: string, location?: CodeLocation) {
    super(location)
    this._text = text
  }

  private _text: string

  get text(): string {
    return this._text
  }

  set text(text: string) {
    this._text = text
    if (this.hostNode) {
      getRenderer().setText(this.hostNode, text)
    }
  }

  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.hostNode) this.hostNode = this.createNode(renderer, this._text)
    renderer[type](this.hostNode, containerOrAnchor)
  }

  protected override doDispose(): void {
    if (this.hostNode) {
      getRenderer().remove(this.hostNode)
      this.hostNode = null
    }
  }

  /** 子类决定具体创建哪种 HostNode */
  protected abstract createNode(renderer: ViewRenderer, text: string): Node
}

/**
 * TextView 类用于表示和渲染文本节点。
 * 核心功能：
 * - 创建和管理文本节点
 * - 提供文本渲染的基础功能
 *
 * @example
 * ```typescript
 * const textView = new TextView();
 * textView.mount(container);
 * ```
 */
export class TextView extends BaseAtomicView<ViewKind.TEXT, HostText> {
  readonly kind = ViewKind.TEXT
  protected override createNode(renderer: ViewRenderer, text: string): HostText {
    return renderer.createText(text)
  }
}

/**
 * CommentView 类用于表示和渲染注释节点。
 *
 * 核心功能：
 * - 继承自 BaseAtomicView，专门处理注释类型的视图
 * - 提供注释渲染的基础功能
 *
 * 使用示例：
 * ```typescript
 * const commentView = new CommentView();
 * commentView.mount(container);
 * ```
 */
export class CommentView extends BaseAtomicView<ViewKind.COMMENT, HostComment> {
  readonly kind = ViewKind.COMMENT
  protected override createNode(renderer: ViewRenderer, text: string): HostComment {
    return renderer.createComment(text)
  }
}
