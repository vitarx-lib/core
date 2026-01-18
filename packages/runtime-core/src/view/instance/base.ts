import { App } from '../../app/index.js'
import { ViewState } from '../../shared/constants/viewState.js'
import type { HostNode, ParentView } from '../../types/index.js'
import type { WidgetInstance } from './widget.js'

export abstract class ViewInstance {
  /** @internal - 父视图 */
  readonly parent: ParentView | null
  /** @internal - 所属应用 */
  readonly app: App | null
  /** @internal - 父组件 */
  readonly owner: WidgetInstance | null
  /** @internal - 平台节点，运行在浏览器中时则是HTMLElement,Text,Comment...等实例 */
  abstract readonly hostNode: HostNode
  /** @internal - 视图运行状态 */
  state: ViewState = ViewState.CREATED
  /** @internal - 是否在Svg命名空间 */
  svgNamespace: boolean
  /** @internal - 副作用清理，仅 DynamicView 和 ElementView 运行时存在需要清理的副作用 */
  cleanup?: () => void

  protected constructor(parent: ParentView | null, owner: WidgetInstance | null, app: App | null) {
    this.parent = parent
    this.owner = owner
    this.app = app
    this.svgNamespace = parent?.instance?.svgNamespace ?? false
  }
}
