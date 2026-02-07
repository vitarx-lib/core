import { type Ref } from '@vitarx/responsive'
import { logger } from '@vitarx/utils'
import { ViewKind } from '../../constants/index.js'
import { viewEffect, type ViewEffect } from '../../runtime/effect.js'
import { withDirectives } from '../../runtime/index.js'
import { isView } from '../../shared/index.js'
import type {
  CodeLocation,
  DirectiveMap,
  HostContainer,
  HostNode,
  MountType,
  View
} from '../../types/index.js'
import { CommentView, TextView } from './atomic.js'
import { BaseView } from './base.js'

type SourceValueType = 'view' | 'text' | 'empty'
type CommitMode = 'full' | 'pointer-only'
interface CommitOptions {
  /**
   * 覆盖目标 View
   *
   * @default `next`
   */
  next?: View
  /**
   * 提交模式
   *
   * - `full`：完全替换
   * - `pointer-only`：仅替换指针，不处理状态，必须保证状态对齐 ！！！
   *
   * @default `full`
   */
  mode?: CommitMode
}
/**
 * 视图切换事务接口
 * 负责协调 prev/next 视图、commit 与取消逻辑
 */
export interface ViewSwitchTransaction {
  /** 前一个视图 */
  readonly prev: View
  /** 下一个视图 */
  readonly next: View
  /** 原始类型 */
  readonly type: SourceValueType
  /** 标记事务是否已取消 */
  readonly cancelled: boolean
  /** 标记事务是否已提交 */
  readonly committed: boolean
  /**
   * 提交切换事务
   * @param options - 提交选项
   */
  commit(options?: CommitOptions): void
  /** 取消事务 */
  cancel(): void
}

/**
 * 动态视图切换处理器
 *
 * @param tx - 视图切换事务
 * @returns - 返回 `false` 阻止默认的 `commit` 逻辑
 */
export type ViewSwitchHandler = (tx: ViewSwitchTransaction) => void | false

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
 * - 视图切换过程是异步的，可以通过 owner.onViewSwitch 自定义切换逻辑
 * - 在视图切换期间，新的更新请求会被标记为脏(dirty)并在当前切换完成后处理
 * - 如果视图初始化失败，会自动创建一个错误注释视图
 * - 使用时需要确保在合适的时机调用 init/activate/mount 等生命周期方法
 */
export class DynamicView<T = any> extends BaseView<ViewKind.DYNAMIC, HostNode> {
  public readonly kind = ViewKind.DYNAMIC

  public readonly source: Ref<T>
  public directives?: DirectiveMap

  private cachedView: View | null = null
  private cachedType: SourceValueType | null = null
  private effect?: ViewEffect

  #switching = false
  #dirty: boolean = false
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
    let handler: (value: T) => void = this.#initView.bind(this)

    const effect = viewEffect(() => {
      try {
        handler(this.source.value)
      } catch (err) {
        if (!this.cachedView) {
          this.cachedView = new CommentView(`DynamicView Error: init failed`)
        }
        if (this.owner) {
          this.owner.reportError(err, 'view:switch')
        } else {
          logger.error(`Unhandled exception in DynamicView - `, err, this.location)
        }
      }
    })

    if (effect) {
      this.effect = effect
      handler = this.#updateView.bind(this)
    }
    if (this.cachedView?.isDetached) {
      this.cachedView!.init(this.ctx)
    }
  }
  /**
   * 释放资源
   */
  protected override doDispose(): void {
    this.effect?.dispose()
    this.cachedView?.dispose()
    this.#dirty = false
    this.#switching = false
    this.cachedView = null
    this.cachedType = null
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
  /**
   * 完成视图切换
   */
  #done(): void {
    this.#switching = false
    if (this.#dirty) {
      this.#dirty = false
      this.#updateView(this.source.value)
    }
  }
  /** 创建切换事务 */
  #createSwitchTransaction(prev: View, next: View, type: SourceValueType): ViewSwitchTransaction {
    this.#switching = true
    let cancelled = false
    let committed = false

    const tx: ViewSwitchTransaction = {
      get prev(): View {
        return prev
      },
      get next(): View {
        return next
      },
      get type(): SourceValueType {
        return type
      },
      get cancelled(): boolean {
        return cancelled
      },
      get committed(): boolean {
        return committed
      },
      commit: (options?: CommitOptions) => {
        if (cancelled || committed) return
        this.#commitSwitch(tx, options)
        committed = true
        this.#done()
      },
      cancel: () => {
        if (cancelled || committed) return
        cancelled = true
        this.#done()
      }
    }

    return tx
  }

  /**
   * 完成替换
   *
   * @param tx
   * @param options
   * @private
   */
  #commitSwitch(tx: ViewSwitchTransaction, options?: CommitOptions): void {
    if (tx.cancelled || tx.committed) return
    const { next: overrideNext, mode = 'full' } = options ?? {}
    const prev = tx.prev
    const next = overrideNext ?? tx.next
    const type = next === tx.next ? tx.type : 'view'

    if (mode !== 'pointer-only') {
      // 若目标 view 与当前 view 生命周期不一致，需初始化
      if (next.state !== this.state) {
        if (!next.isInitialized) next.init(prev.ctx)
        // 若 prev 已挂载，则挂载新 view
        if (this.isMounted) {
          next.mount(prev.node, 'insert')
        }
      }
      // 同步 active 状态（但不等同 runtime）
      if (this.active !== next.active) {
        next[this.active ? 'activate' : 'deactivate']()
      }
      // 释放旧视图
      prev.dispose() // 处理并释放前一个视图的资源
    }

    this.cachedView = next // 缓存当前目标视图
    this.cachedType = type // 根据目标视图是否为下一个视图，设置缓存类型
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
  }
  /**
   * 更新视图的方法，根据传入的值来决定如何更新或切换视图
   * @param value - 任意类型的值，用于决定视图的更新方式
   */
  #updateView(value: unknown): void {
    if (this.#switching) {
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

    const owner = this.owner
    // 若上层组件接管切换
    if (owner?.subView === this && owner.onViewSwitch) {
      const result = owner.onViewSwitch(tx)
      // 显式接管
      if (result === false) return
    }
    // 默认立即提交
    tx.commit()
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
