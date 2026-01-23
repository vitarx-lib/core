import { IS_RAW } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { ComponentInstance } from '../../runtime/index.js'
import { IS_VIEW } from '../../shared/constants/symbol.js'
import { ViewKind } from '../../shared/constants/viewFlag.js'
import { ViewState } from '../../shared/constants/viewState.js'
import type {
  CodeLocation,
  HostContainer,
  HostNode,
  MountType,
  ViewContext
} from '../../types/index.js'

export abstract class BaseView<K extends ViewKind> {
  /** @internal 标记为视图对象，方便isView判断 */
  readonly [IS_VIEW]: true = true
  /** @internal 避免被响应式代理 */
  readonly [IS_RAW]: true = true
  /** @internal 视图类型 */
  abstract readonly kind: K
  /** @internal DOM节点 */
  public abstract $node: HostNode | null
  /** @internal 仅For组件使用 */
  public key?: unknown
  /** @internal 代码位置，仅调试模式存在 */
  public location?: CodeLocation
  /** @internal 上下文*/
  protected ctx?: ViewContext
  /** @internal 视图状态 */
  protected state: ViewState = ViewState.UNUSED
  constructor(key?: unknown, location?: CodeLocation) {
    this.key = key
    this.location = location
  }
  get isMounted(): boolean {
    return this.state === ViewState.MOUNTED
  }
  get isPrepared(): boolean {
    return this.state === ViewState.PREPARED
  }
  get owner(): ComponentInstance | null {
    return this.ctx?.owner ?? null
  }
  get app(): App | null {
    return this.ctx?.app ?? null
  }
  /** 初始化运行时（不创建 DOM，不可见） */
  init(ctx?: ViewContext): void {
    if (__DEV__ && this.state !== ViewState.UNUSED) {
      throw new Error('[View.init]: 视图正在运行，不能进行初始化')
    }
    this.ctx = ctx
    this.doInit?.()
    this.state = ViewState.PREPARED
  }
  /** 挂载到宿主（创建 / 插入 DOM） */
  mount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    if (__SSR__) {
      throw new Error('[View.mount]: is not supported in SSR mode')
    }
    if (this.state === ViewState.MOUNTED) {
      throw new Error('[View.mount]: The view is mounted and cannot be mounted repeatedly')
    }
    if (this.state === ViewState.UNUSED) this.init()
    this.doMount?.(containerOrAnchor, type)
    this.state = ViewState.MOUNTED
  }
  /** 彻底销毁（不可再次使用，或需重新 init） */
  dispose(): void {
    if (this.state === ViewState.UNUSED) return
    this.doDispose?.()
    delete this.ctx
    this.state = ViewState.UNUSED
  }
  protected doInit?(): void
  protected doMount?(containerOrAnchor: HostContainer | HostNode, type: MountType): void
  protected doDispose?(): void
}
