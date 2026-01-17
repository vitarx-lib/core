import { App } from '../../app/index.js'
import type { HostNode, ParentView } from '../../types/index.js'
import { ViewInstance } from './base.js'
import type { WidgetInstance } from './widget.js'

export class HostViewInstance<T extends HostNode = HostNode> extends ViewInstance {
  public $element: T | null = null
  constructor(parent: ParentView | null, owner: WidgetInstance | null, app: App | null) {
    super(parent, owner, app)
  }
  override get hostNode(): T {
    if (this.$element === null) {
      throw new Error('ElementViewInstance.hostNode() called before element was set')
    }
    return this.$element
  }
}
