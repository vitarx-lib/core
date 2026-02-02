import { IS_RAW } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { ViewState } from '../../constants/index.js'
import { IS_VIEW } from '../../constants/symbol.js'
import { ViewKind } from '../../constants/viewKind.js'
import type {
  CodeLocation,
  HostContainer,
  HostNode,
  MountType,
  ViewContext
} from '../../types/index.js'
import type { ComponentInstance } from './component.js'

export abstract class BaseView<K extends ViewKind, Node extends HostNode> {
  /** @internal 标记为视图对象，方便isView判断 */
  readonly [IS_VIEW]: true = true
  /** @internal 避免被响应式代理 */
  readonly [IS_RAW]: true = true
  /** @internal 视图类型 */
  abstract readonly kind: K
  /** @internal 上下文 */
  public ctx?: ViewContext
  /** @internal 代码位置，仅调试模式存在 */
  public location?: CodeLocation
  /** @internal DOM节点 */
  protected abstract hostNode: Node | null
  /** @internal 视图状态 */
  private _state: ViewState = ViewState.UNUSED
  constructor(location?: CodeLocation) {
    this.location = location
  }
  get state(): ViewState {
    return this._state
  }
  get owner(): ComponentInstance | null {
    return this.ctx?.owner ?? null
  }
  get app(): App | null {
    return this.ctx?.app ?? null
  }
  get isActivated(): boolean {
    return this._state === ViewState.ACTIVATED
  }
  get isInitialized(): boolean {
    return this._state === ViewState.INITIALIZED
  }
  get isDeactivated(): boolean {
    return this._state === ViewState.DEACTIVATED
  }
  get isUnused(): boolean {
    return this._state === ViewState.UNUSED
  }
  /**
   * 获取host节点
   *
   * @returns {Node} host节点
   * @throws {Error} 当HOST节点不存在时抛出异常
   */
  get node(): Node {
    if (!this.hostNode) {
      throw new Error(
        `[View.node]: Host Node access failed. Current view state is '${this._state}', ` +
          `but the host node has not been created or has been destroyed. ` +
          `Ensure the view is properly initialized and mounted before accessing the node.`
      )
    }
    return this.hostNode
  }
  /** 初始化运行时（不创建 DOM，不可见） */
  init(ctx?: ViewContext): this {
    if (!this.isUnused) return this
    this.ctx = ctx
    this.doInit?.()
    this._state = ViewState.INITIALIZED
    return this
  }
  /** 挂载到宿主（创建 / 插入 DOM） */
  mount(target: HostContainer | HostNode, type: MountType = 'append'): this {
    if (__SSR__) {
      throw new Error('[View.mount]: is not supported in SSR mode')
    }
    if (this.isUnused) {
      this.init()
    } else if (!this.isInitialized) {
      throw new Error(
        `[View.mount]: Mount operation can only be executed when view is in '${ViewState.INITIALIZED}' state. ` +
          `Current view state is '${this._state}', which does not meet the pre-condition for mount operation. ` +
          `Ensure the view has completed initialization phase (init() method called) before attempting to mount.`
      )
    }
    this.doMount?.(target, type)
    this._state = ViewState.ACTIVATED
    return this
  }
  /** 彻底销毁（不可再次使用，或需重新 init） */
  dispose(): this {
    if (this._state === ViewState.UNUSED) return this
    this.doDispose?.()
    delete this.ctx
    this._state = ViewState.UNUSED
    return this
  }
  /**
   * 激活视图
   *
   * 激活已被冻结的视图树，必须与 `deactivate` 搭配使用
   *
   * @internal
   */
  activate(): this {
    if (this._state !== ViewState.DEACTIVATED) {
      throw new Error(
        `[View.activate]: Cannot activate view: expected state '${ViewState.DEACTIVATED}', ` +
          `but current state is '${this._state}'. ` +
          `Only deactivated views can be activated.`
      )
    }
    this.doActivate?.()
    this._state = ViewState.ACTIVATED
    return this
  }
  /**
   * 停用视图
   *
   * 冻结视图树并停用响应式，必须与 activate 搭配使用
   *
   * @internal
   */
  deactivate(): this {
    if (this._state !== ViewState.ACTIVATED) {
      throw new Error(
        `[View.deactivate]: Cannot deactivate view: expected state '${ViewState.ACTIVATED}', ` +
          `but current state is '${this._state}'. ` +
          `Only activated views can be deactivated.`
      )
    }
    this.doDeactivate?.()
    this._state = ViewState.DEACTIVATED
    return this
  }
  protected doActivate?(): void
  protected doDeactivate?(): void
  protected doInit?(): void
  protected doMount?(target: HostContainer | HostNode, type: MountType): void
  protected doDispose?(): void
}
