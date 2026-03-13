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
    if (__VITARX_DEV__) {
      this.location = location
      this.#state = shallowRef(ViewState.DETACHED)
      this.#active = shallowRef(false)
    } else {
      this.#state = ViewState.DETACHED
      this.#active = false
    }
  }

  /**
   * 获取视图状态的getter方法
   * 根据环境返回不同的状态值
   *
   * @returns {ViewState} 返回视图状态
   */
  get state(): ViewState {
    return __VITARX_DEV__ && isRef(this.#state) ? this.#state.value : (this.#state as ViewState)
  }
  /**
   * 获取当前组件的拥有者（父级）组件实例
   * 这是一个 getter 属性，用于访问当前组件的上下文中的拥有者
   * 如果上下文中不存在拥有者，则返回 null
   *
   * @returns {ComponentInstance | null} 返回拥有者组件实例，如果不存在则返回 null
   */
  get owner(): ComponentInstance | null {
    return this.ctx?.owner ?? null
  }

  /**
   * 获取当前上下文关联的应用实例
   *
   * @returns {App | null} 返回应用实例，如果不存在则返回 null
   */
  get app(): App | null {
    return this.ctx?.app ?? null
  }

  /**
   * 获取活动状态的属性访问器
   *
   * @returns {boolean} 返回当前的活动状态
   */
  get active(): boolean {
    // 检查是否处于开发环境且 this.#active 是否为响应式引用
    // 如果是，则返回响应式引用的值
    // 否则，直接将 this.#active 作为布尔值返回
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
      throw new Error(`[View.node] Host node not available, current state is '${this.state}'`)
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
      throw new Error('[View.init] View has already been initialized')
    }
    this.ctx = ctx
    this.doInit?.()
    this.#setState(ViewState.INITIALIZED)
    this.#setActive(true)
    return this
  }
  /** 挂载到宿主（创建 / 插入 DOM） */
  mount(target: HostContainer | HostNode, type: MountType = 'append'): this {
    if (__VITARX_SSR__) {
      throw new Error('[View.mount] Not supported in SSR mode')
    }
    if (this.isDetached) {
      this.init()
    } else if (!this.isInitialized) {
      throw new Error('[View.mount] View must be initialized before mounting')
    }
    this.doMount?.(target, type)
    this.#setState(ViewState.MOUNTED)
    return this
  }

  /**
   * 彻底销毁（可重新 init）
   *
   * @param [root=true] - 是否为根，此参数为内部递归时自动传递，外部无需传入，
   * 如传入`false`不会自动移除`hostNode`
   */
  dispose(root: boolean = true): this {
    if (!this.isRuntime) return this
    this.doDispose?.(root)
    delete this.ctx
    this.#setActive(false)
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
      throw new Error('[View.activate] View is not in runtime state')
    }
    if (this.active) {
      throw new Error('[View.activate] View is already active')
    }
    this.doActivate?.()
    this.#setActive(true)
    return this
  }
  deactivate(): this {
    if (!this.isRuntime) {
      throw new Error('[View.deactivate] View is not in runtime state')
    }
    if (!this.active) {
      throw new Error('[View.deactivate] View is already inactive')
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
  protected doDispose?(root: boolean): void

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
