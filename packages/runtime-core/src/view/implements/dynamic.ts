import { type Ref, watch, Watcher } from '@vitarx/responsive'
import { isArray, logger } from '@vitarx/utils'
import { ViewKind } from '../../constants/index.js'
import { getRenderer, withDirectives } from '../../runtime/index.js'
import { isView } from '../../shared/index.js'
import type {
  CodeLocation,
  HostComment,
  HostContainer,
  HostNode,
  MountType,
  View,
  ViewRenderer
} from '../../types/index.js'
import { CommentView, TextView } from './atomic.js'
import { BaseView } from './base.js'

type SourceValueType = 'view' | 'text' | 'empty'
/**
 * 视图切换事务接口
 * 负责协调 prev/next 视图、commit 逻辑
 */
export interface ViewSwitchTransaction {
  readonly prev: View
  readonly next: View
  /**停止冒泡传播*/
  readonly propagationStopped: boolean
  /** 标记事务是否已提交 */
  readonly committed: boolean
  /**
   * 缓存 prev 视图
   *
   * 配置为 true 时 prev 视图的操作行为： prev.deactivate() + renderer.remove(prev.node)
   *
   * @default `false`
   */
  cachePrev?: boolean

  /**
   * 停止冒泡传播，并阻止自动提交
   */
  stopPropagation(): void
  /**
   * 提交下一个视图
   *
   * 如果将 `forceFlush` 设置为 `true`，则会强制刷新事务，
   * 跳过检查 `prev` 是否已提交，强制将当前事务置为完成状态。
   *
   * 如果在 `commitPrev()` 之前调用 `commitNext(true)` ，
   * 需在适当时机调用 `commitPrev()` 或自行接管 `prev` 的卸载逻辑，否则可能会造成内存泄露或其他非预期影响。
   *
   * 注意：此方法在 `committed=true` 时调用无效。
   *
   * @param [forceFlush=false] - 是否强制刷新事务
   */
  commitNext(forceFlush?: boolean): void
  /**
   * 提交上一个视图
   *
   * 注意：在 `commitNext(true)` 后此方法还可以被调用，仅处理 `prev` 的卸载逻辑。
   */
  commitPrev(): void
  /**
   * 提交完整的事务
   */
  commit(): void
}
/**
 * 动态视图切换处理器
 *
 * @param tx - 视图切换事务
 */
export type ViewSwitchHandler = (tx: ViewSwitchTransaction) => void

/**
 * 动态视图类，用于根据响应式数据源的变化动态渲染不同的视图内容。
 *
 * 核心功能：
 * - 监听响应式数据源(source)的变化
 * - 根据数据类型自动选择合适的视图类型（文本视图、空视图或自定义视图）
 * - 提供视图切换的事务机制，支持自定义切换逻辑
 * - 管理视图的生命周期（初始化、激活、停用、挂载、释放）
 * - 支持指令(directives)的应用
 *
 * @example
 * ```typescript
 * const source = ref('Hello World')
 * const dynamicView = new DynamicView(source)
 * dynamicView.init(ctx)
 *
 * // 更新数据源会自动触发视图更新
 * source.value = 'New Text'  // 更新为文本视图
 * source.value = null        // 更新为空视图
 * source.value = new TextView('Custom') // 更新为自定义视图
 * ```
 *
 * @param source - 响应式数据源，视图会根据此数据的变化而更新
 * @param location - 可选，代码位置信息，用于错误追踪
 *
 * @remarks
 * - 视图切换过程是异步的，可以通过 owner.onViewSwitch 管理/配置事务
 * - 在视图切换期间，新的更新请求会被标记为脏(dirty)并在当前切换完成后处理
 * - 如果视图初始化失败，会自动创建一个错误注释视图
 */
export class DynamicView<T = any> extends BaseView<ViewKind.DYNAMIC, HostNode> {
  public readonly kind = ViewKind.DYNAMIC

  public readonly source: Ref<T>

  private cachedView: View | null = null
  private cachedType: SourceValueType | null = null
  private effect?: Watcher

  /**
   * 标记当前事务是否为脏
   * @private
   */
  #dirty: boolean = false
  /**
   * 事务取消函数
   * @private
   */
  #cancelTx: (() => void) | null = null
  constructor(source: Ref, location?: CodeLocation) {
    super(location)
    this.source = source // 初始化数据源
  }

  /**
   * 获取当前视图
   * @returns 当前缓存的视图实例，如果没有则为 null
   */
  get current(): View | null {
    return this.cachedView
  }

  /**
   * 获取宿主节点
   * @returns 当前视图的宿主节点，如果没有则为 null
   */
  protected get hostNode(): HostNode | null {
    return this.cachedView?.node ?? null
  }
  /**
   * 初始化视图
   */
  protected override doInit(): void {
    this.#initView(this.source.value)
    this.effect = watch(
      this.source,
      newValue => {
        try {
          this.#updateView(newValue)
        } catch (err) {
          if (this.owner) {
            this.owner.reportError(err, 'view:switch')
          } else {
            throw err
          }
        }
      },
      { scope: false, flush: 'main' }
    )
  }
  /**
   * 释放资源
   */
  protected override doDispose(root: boolean): void {
    this.effect?.dispose()
    this.cachedView?.dispose(root)
    this.#dirty = false
    if (this.#cancelTx) this.#cancelTx()
    this.cachedView = this.cachedType = null
  }
  /**
   * 激活视图
   */
  protected override doActivate(): void {
    this.cachedView!.activate()
    this.effect?.resume()
  }
  /**
   * 停用视图
   */
  protected override doDeactivate(): void {
    this.effect?.pause()
    this.cachedView!.deactivate()
  }
  /**
   * 挂载视图
   * @param containerOrAnchor - 宿主容器或锚点节点
   * @param type - 挂载类型
   */
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType): void {
    this.cachedView!.mount(containerOrAnchor, type)
  }
  /** 创建切换事务 */
  #createSwitchTransaction(prev: View, next: View, type: SourceValueType): ViewSwitchTransaction {
    const renderer = getRenderer()

    // 事务状态
    const state = {
      committed: false,
      propagationStopped: false,
      nextCommitted: false,
      prevCommitted: false,
      anchor: null as HostComment | null
    }

    // 创建占位符锚点
    if (prev.isMounted) {
      state.anchor = renderer.createComment('')
      renderer.insert(state.anchor, prev.node)
    }

    // 完成事务
    const finish = () => {
      state.committed = true
      this.cachedView = next
      this.cachedType = type
      this.#cancelTx = null
      if (this.#dirty) {
        this.#dirty = false
        this.#updateView(this.source.value)
      }
    }

    this.#cancelTx = () => {
      if (state.committed) return
      // 移除占位符锚点
      if (state.anchor) renderer.remove(state.anchor)
      state.committed = true
      this.#cancelTx = null
    }

    const tx: ViewSwitchTransaction = {
      get prev() {
        return prev
      },
      get next() {
        return next
      },
      get committed() {
        return state.committed
      },
      get propagationStopped() {
        return state.propagationStopped
      },
      stopPropagation: () => {
        state.propagationStopped = true
      },
      commitNext: (forceFlush: boolean = false) => {
        if (state.committed || state.nextCommitted) return
        state.nextCommitted = true
        this.#commitNext(tx, state.anchor, renderer)
        if (forceFlush || state.prevCommitted) {
          finish()
        }
      },
      commitPrev: () => {
        if (state.prevCommitted) return
        state.prevCommitted = true
        this.#commitPrev(tx, renderer)
        if (!state.committed && state.nextCommitted) {
          finish()
        }
      },
      commit: () => {
        if (state.committed) return
        if (!state.prevCommitted) {
          state.prevCommitted = true
          this.#commitPrev(tx, renderer)
        }
        if (!state.nextCommitted) {
          state.nextCommitted = true
          this.#commitNext(tx, state.anchor, renderer)
        }
        finish()
      }
    }
    return tx
  }

  /**
   * 提交上一个视图
   *
   * @param tx
   * @param renderer
   * @private
   */
  #commitPrev(tx: ViewSwitchTransaction, renderer: ViewRenderer): void {
    const { prev, cachePrev } = tx
    if (cachePrev) {
      prev.deactivate()
      if (prev.isMounted) renderer.remove(prev.node)
    } else {
      prev.dispose()
    }
  }

  /**
   * 提交下一个视图
   *
   * @param tx
   * @param anchor
   * @param renderer
   * @private
   */
  #commitNext(tx: ViewSwitchTransaction, anchor: HostNode | null, renderer: ViewRenderer): void {
    const { next, prev } = tx
    if (next.state !== this.state) {
      // 新视图：初始化并挂载
      if (next.isDetached) next.init(this.ctx)
      if (this.isMounted) {
        next.mount(anchor ?? prev.node, 'insert')
      }
    } else if (!next.isActive && this.isMounted) {
      // 缓存视图复用：插入 DOM（状态已在 commitPrev 后对齐）
      renderer.replace(next.node, anchor ?? prev.node)
    }

    // 清理锚点
    if (anchor) renderer.remove(anchor)

    // 同步 active 状态
    if (this.isRuntime && this.isActive !== next.isActive) {
      next[this.isActive ? 'activate' : 'deactivate']()
    }
  }

  /**
   * 初始化视图方法
   * @param value - 需要渲染的值
   */
  #initView(value: any): void {
    // 解析值的类型
    const type = this.#resolveType(value)
    // 根据值和类型解析对应的视图
    const view = this.#resolveView(value, type)
    // 如果存在指令，则将指令应用到视图上
    if (this.directives) {
      withDirectives(view, Array.from(this.directives))
    }
    // 缓存解析出的类型和视图
    this.cachedType = type
    this.cachedView = view
    if (view.isDetached) view.init(this.ctx)
  }
  /**
   * 更新视图的方法，根据传入的值来决定如何更新或切换视图
   * @param value - 任意类型的值，用于决定视图的更新方式
   */
  #updateView(value: unknown): void {
    if (this.#cancelTx) {
      this.#dirty = true
      return
    }
    const type = this.#resolveType(value)

    const prevView = this.cachedView!
    const prevType = this.cachedType!

    // 快路径（类型一致）
    if (prevType === type) {
      switch (type) {
        case 'text':
          ;(prevView as TextView).text = String(value)
          return
        case 'empty':
          return
        case 'view':
          if (value === prevView) return
          break
      }
    }

    // 慢路径（结构切换）
    const nextView = this.#resolveView(value, type)

    // 应用 directives（如果存在）
    if (this.directives) {
      withDirectives(nextView, Array.from(this.directives))
    }

    const tx = this.#createSwitchTransaction(prevView, nextView, type)
    // 冒泡触发 onViewSwitch
    this.#bubbleViewSwitch(tx)
    // 冒泡完成后，自动提交
    if (!tx.propagationStopped && !tx.committed) tx.commit()
  }
  /**
   * 冒泡触发 onViewSwitch
   *
   * 冒泡规则：
   * 1. 如果 DynamicView 父组件的根视图（subView）是 DynamicView 自身，则触发 onViewSwitch
   * 2. 继续判断 DynamicView 父组件的父组件的根视图是否为 DynamicView 父组件视图，依次类推冒泡
   * 3. 如果事务已提交，停止冒泡
   * 4. 如果调用了 stopPropagation()，停止冒泡
   */
  #bubbleViewSwitch(tx: ViewSwitchTransaction): void {
    let currentOwner = this.owner
    let currentView: View = this

    while (currentOwner && !tx.committed && !tx.propagationStopped) {
      // 检查当前 owner 的 subView 是否为当前视图
      if (currentOwner.subView === currentView) {
        // 触发 onViewSwitch
        if (currentOwner.onViewSwitch) {
          currentOwner.onViewSwitch(tx)
        }
        // 继续向上冒泡
        currentView = currentOwner.view
        currentOwner = currentOwner.parent
      } else {
        // subView 不是当前视图，停止冒泡
        break
      }
    }
  }
  #resolveType(input: unknown): SourceValueType {
    if (isView(input)) return 'view'
    switch (typeof input) {
      case 'number':
        return 'text'
      case 'string':
        if (input.length === 0) return 'empty'
        return 'text'
      default:
        if (__VITARX_DEV__) {
          if (input != null && typeof input !== 'boolean') {
            if (isArray(input)) {
              logger.warn(
                `[DynamicView]: Array type is not supported for dynamic rendering. ` +
                  `The value type must be Primitive (string, number, boolean) or View instance. ` +
                  `Received: Array[${input.length} items]. ` +
                  `If you need to render a list, consider using map() in your template expression, ` +
                  `e.g., "{cond && list.map(item => <ListItem data={item} />)}".`,
                this.location
              )
            } else {
              logger.warn(
                `[DynamicView]: Invalid value type "${typeof input}" for dynamic rendering. ` +
                  `This value will be treated as an empty element (null/undefined). ` +
                  `Supported types: Primitive (string, number, boolean) or View instance.`,
                this.location
              )
            }
          }
        }
        return 'empty'
    }
  }
  #resolveView(value: unknown, type: SourceValueType): View {
    switch (type) {
      case 'view':
        return value as View
      case 'text':
        return new TextView(String(value))
      case 'empty':
        return new CommentView('v-if')
    }
  }
}
