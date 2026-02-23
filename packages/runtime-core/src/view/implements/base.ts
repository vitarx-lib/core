import { IS_RAW, isRef, type Ref, ShallowRef, shallowRef } from '@vitarx/responsive'
import { App } from '../../app/index.js'
import { ViewState } from '../../constants/index.js'
import { IS_VIEW } from '../../constants/symbol.js'
import { ViewKind } from '../../constants/viewKind.js'
import type {
  CodeLocation,
  DirectiveMap,
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
  /** @readonly 代码位置，仅调试模式存在 */
  public readonly location?: CodeLocation
  /** 视图类型 */
  abstract readonly kind: K
  /** 上下文 */
  public ctx?: ViewContext
  /** DOM节点 */
  protected abstract hostNode: Node | null
  /** @internal 视图状态 */
  #state: ViewState | Ref<ViewState>
  /** @internal 是否冻结 */
  #active: boolean | ShallowRef<boolean>
  /** 指令映射表 */
  public directives?: DirectiveMap

  constructor(location?: CodeLocation) {
    this.location = location
    if (__VITARX_DEV__) {
      this.#state = shallowRef(ViewState.DETACHED)
      this.#active = shallowRef(false)
    } else {
      this.#state = ViewState.DETACHED
      this.#active = false
    }
  }

  get state(): ViewState {
    return __VITARX_DEV__ && isRef(this.#state) ? this.#state.value : (this.#state as ViewState)
  }
  get owner(): ComponentInstance | null {
    return this.ctx?.owner ?? null
  }
  get app(): App | null {
    return this.ctx?.app ?? null
  }

  get active(): boolean {
    return __VITARX_DEV__ && isRef(this.#active) ? this.#active.value : (this.#active as boolean)
  }
  /**
   * 检查视图状态是否已初始化
   * 这是一个getter方法，用于获取当前视图是否处于已初始化状态
   *
   * @returns {boolean} 如果当前视图状态为INITIALIZED则返回true，否则返回false
   */
  get isInitialized(): boolean {
    return this.isState(ViewState.INITIALIZED) // 调用isState方法检查当前状态是否等于ViewState.INITIALIZED
  }
  /**
   * 获取当前视图是否已挂载的状态
   *
   * 这是一个getter方法，用于检查组件是否处于MOUNTED状态
   * @returns {boolean} 如果组件已挂载则返回true，否则返回false
   */
  get isMounted(): boolean {
    return this.isState(ViewState.MOUNTED) // 调用isState方法检查当前状态是否为MOUNTED
  }
  /**
   * 检查当前视图状态是否为已分离(DETACHED)状态
   * 这是一个getter属性，用于获取视图是否处于分离状态的布尔值
   *
   * @returns {boolean} 如果当前视图状态为DETACHED则返回true，否则返回false
   */
  get isDetached(): boolean {
    return this.isState(ViewState.DETACHED)
  }
  /**
   * 获取当前是否处于运行时状态的属性
   *
   * @returns {boolean} 如果当前状态不是ViewState.DETACHED则返回true，表示处于运行时状态；否则返回false
   */
  get isRuntime(): boolean {
    return !this.isState(ViewState.DETACHED)
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
        `[View.node]: Host Node access failed. Current view state is '${this.#state}', ` +
          `\nbut the host node has not been created or has been destroyed. ` +
          `\nEnsure the view is properly initialized and mounted before accessing the node.`
      )
    }
    return this.hostNode
  }

  /**
   * 检查当前状态是否与给定的状态匹配
   * @param state - 要比较的视图状态
   * @returns {boolean} 如果当前状态与给定状态匹配则返回true，否则返回false
   */
  isState(state: ViewState): boolean {
    return this.state === state // 使用严格等于操作符比较当前状态和给定状态
  }

  /** 初始化运行时（不创建 DOM，不可见） */
  init(ctx?: ViewContext): this {
    if (this.isRuntime) {
      throw new Error(
        `[View.init]: The view has already been initialized. ` +
          `\nEnsure the view is not initialized multiple times.`
      )
    }
    this.ctx = ctx
    this.doInit?.()
    this.#setState(ViewState.INITIALIZED)
    this.#active = true
    return this
  }
  /** 挂载到宿主（创建 / 插入 DOM） */
  mount(target: HostContainer | HostNode, type: MountType = 'append'): this {
    if (__VITARX_SSR__) {
      throw new Error('[View.mount]: is not supported in SSR mode')
    }
    if (this.isDetached) {
      this.init()
    } else if (!this.isInitialized) {
      throw new Error(
        `[View.mount]: Mount operation can only be executed when view is in '${ViewState.INITIALIZED}' state. ` +
          `\nCurrent view state is '${this.#state}', which does not meet the pre-condition for mount operation. ` +
          `\nEnsure the view has completed initialization phase (init() method called) before attempting to mount.`
      )
    }
    this.doMount?.(target, type)
    this.#setState(ViewState.MOUNTED)
    return this
  }
  /** 彻底销毁（不可再次使用，或需重新 init） */
  dispose(): this {
    if (!this.isRuntime) return this
    this.doDispose?.()
    delete this.ctx
    this.#active = false
    this.#setState(ViewState.DETACHED)
    return this
  }
  /**
   * 激活视图响应式
   *
   * 解除已被停用的视图树，恢复响应式，必须与 `deactivate` 搭配使用
   */
  activate(): this {
    if (!this.isRuntime) {
      throw new Error(
        `[View.activate]: View is already dispose or nonused. ` +
          `Ensure the view has been initialized (init() method called) before attempting to activate.`
      )
    }
    if (this.#active) {
      throw new Error(
        `[View.activate]: View is already activate. ` +
          `Ensure the view has been deactivate (deactivate by calling deactivate() method) before attempting to activate.`
      )
    }
    this.doActivate?.()
    this.#setActive(true)
    return this
  }
  /**
   * 停用视图响应式
   *
   * 停用视图树响应式，必须与 `activate` 搭配使用
   */
  deactivate(): this {
    if (!this.isRuntime) {
      throw new Error(
        `[View.deactivate]: View is already dispose or nonused. ` +
          `Ensure the view has been initialized (init() method called) before attempting to deactivate.`
      )
    }
    if (!this.active) {
      throw new Error(
        `[View.deactivate]: View is already deactivate. ` +
          `If you want to activate the view, use the activate() method instead.`
      )
    }
    this.doDeactivate?.()
    this.#setActive(false)
    return this
  }
  /**
   * 激活视图
   * @protected
   */
  protected doActivate?(): void
  /**
   * 停用视图
   * @protected
   */
  protected doDeactivate?(): void
  /**
   * 初始化视图
   * @protected
   */
  protected doInit?(): void
  /**
   * 挂载视图
   * @protected
   */
  protected doMount?(target: HostContainer | HostNode, type: MountType): void
  /**
   * 卸载视图
   * @protected
   */
  protected doDispose?(): void

  #setState(state: ViewState): void {
    if (__VITARX_DEV__ && isRef(this.#state)) {
      this.#state.value = state
    } else {
      this.#state = state
    }
  }
  #setActive(active: boolean): void {
    if (__VITARX_DEV__ && isRef(this.#active)) {
      this.#active.value = active
    } else {
      this.#active = active
    }
  }
}
