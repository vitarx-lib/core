import { getRenderer } from '../../runtime/index.js'
import { ViewKind } from '../../shared/constants/viewFlag.js'
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
> extends BaseView<Kind> {
  public $node: Node | null = null

  constructor(text: string, key?: unknown, location?: CodeLocation) {
    super(key, location)
    this._text = text
  }

  private _text: string

  get text(): string {
    return this._text
  }

  set text(text: string) {
    this._text = text
    if (this.$node) {
      getRenderer().setText(this.$node, text)
    }
  }

  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    const renderer = getRenderer()
    if (!this.$node) this.$node = this.createNode(renderer, this._text)
    renderer[type](this.$node, containerOrAnchor)
  }

  protected override doDispose(): void {
    if (this.$node) getRenderer().remove(this.$node)
  }

  /** 子类决定具体创建哪种 HostNode */
  protected abstract createNode(renderer: ViewRenderer, text: string): Node
}

export class TextView extends BaseAtomicView<ViewKind.TEXT, HostText> {
  readonly kind = ViewKind.TEXT
  protected override createNode(renderer: ViewRenderer, text: string): HostText {
    return renderer.createText(text)
  }
}

export class CommentView extends BaseAtomicView<ViewKind.COMMENT, HostComment> {
  readonly kind = ViewKind.COMMENT
  protected override createNode(renderer: ViewRenderer, text: string): HostComment {
    return renderer.createComment(text)
  }
}
