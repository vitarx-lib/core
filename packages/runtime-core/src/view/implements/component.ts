import { EffectScope, isRef, markRaw, type Ref } from '@vitarx/responsive'
import { isFunction, isPromise, logger } from '@vitarx/utils'
import { App } from '../../app/index.js'
import { Lifecycle, SUSPENSE_COUNTER, ViewKind } from '../../constants/index.js'
import { runComponent, withDirectives } from '../../runtime/index.js'
import type {
  AnyProps,
  CodeLocation,
  Component,
  ComponentProps,
  ComponentPublicInstance,
  Directive,
  DirectiveMap,
  ErrorHandler,
  ErrorSource,
  HookStore,
  HostContainer,
  HostNode,
  InstanceRef,
  MountType,
  View,
  ViewContext
} from '../../types/index.js'
import { applyRef, mergeDefaultProps, resolveChild, resolveProps } from '../compiler/resolve.js'
import { CommentView } from './atomic.js'
import { BaseView } from './base.js'
import type { ViewSwitchHandler } from './dynamic.js'

/**
 * ComponentView 是用于管理和渲染组件实例的视图类。
 * 它负责组件的初始化、挂载、更新和销毁等生命周期管理。
 *
 * 核心功能：
 * - 组件实例的创建和管理
 * - 组件属性解析和引用处理
 * - 组件生命周期控制（初始化、挂载、销毁）
 * - 组件子视图的管理
 *
 * @example
 * ```typescript
 * const componentView = new ComponentView(MyComponent, { prop1: 'value' }, 'myKey');
 * componentView.init();
 * componentView.mount(container);
 * ```
 *
 * @template T - 组件类型，默认为 Component
 *
 * @param component - 组件实体函数，定义组件的实现
 * @param props - 传递给组件的属性对象，可以为 null
 * @param key - 可选的唯一标识符，用于视图追踪
 * @param location - 可选的代码位置信息，用于调试
 *
 * @remarks
 * - 组件实例在初始化时创建，在销毁时释放
 * - 组件引用(ref)会在挂载时自动设置
 * - 组件销毁时会自动清理子视图和实例
 */
export class ComponentView<T extends Component = Component> extends BaseView<
  ViewKind.COMPONENT,
  HostNode
> {
  /** @internal 类型标识 */
  public readonly kind = ViewKind.COMPONENT
  /** @internal 引用组件公开实例 */
  public readonly ref: InstanceRef | undefined
  /** @internal 组件实体函数 */
  public readonly component: T
  /** @internal 传递给组件的参数 */
  public readonly props: AnyProps
  /** @internal 指令映射表 */
  public directives?: DirectiveMap
  /** @internal 组件运行时实例 */
  public instance: ComponentInstance<T> | null = null
  constructor(component: T, props: ComponentProps<T> | null = null, location?: CodeLocation) {
    super(location)
    this.component = component
    const { props: inputProps, ref } = resolveProps(props)
    this.ref = ref
    const resolvedProps: AnyProps = mergeDefaultProps(inputProps, component.defaultProps)
    // 开发时直接冻结
    if (__DEV__) {
      if (isFunction(component.validateProps)) {
        const result = component.validateProps(resolvedProps, location)
        // 校验失败处理
        if (result === false) {
          // 记录错误日志，包含源信息
          logger.error(`[${this.name}] props validation failed.`, this.location)
        } else if (typeof result === 'string') {
          // 如果返回的是字符串，则记录警告日志
          logger.warn(`[${this.name}]: ${result}`, this.location)
        }
      }
    }
    this.props = resolvedProps
  }
  /**
   * 获取组件名称的getter方法
   * 如果组件有displayName属性则使用displayName，否则使用name属性，如果都没有则使用默认值'anonymous'
   *
   * 返回格式为"Component<实际名称>"的字符串
   */
  get name(): string {
    return this.component.displayName ?? this.component.name ?? 'anonymous'
  }
  protected get hostNode(): HostNode | null {
    return this.instance?.subView.node ?? null
  }
  get subView(): View | null {
    return this.instance?.subView ?? null
  }
  protected override doActivate(): void {
    this.subView?.activate()
    // 子 -> 父
    this.instance?.scope.resume()
    this.instance?.show()
  }
  protected override doDeactivate(): void {
    // 父 -> 子
    this.instance?.scope.pause()
    this.instance?.hide()
    this.subView?.deactivate()
  }
  protected override doInit(): void {
    this.instance = new ComponentInstance<T>(this)
    this.instance.init()
    this.instance.subView.init(this.instance.subViewContext)
  }

  /**
   * @inheritDoc
   */
  override mount(target: HostContainer | HostNode, type: MountType = 'append'): this {
    super.mount(target, type)
    // 子 -> 父
    this.instance!.mounted()
    return this
  }

  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType) {
    // 父 -> 子
    this.instance!.beforeMount()
    if (this.ref) applyRef(this.ref, this.instance!.publicInstance)
    this.subView!.mount(containerOrAnchor, type)
    // 子 -> 父
    this.instance!.show()
  }
  protected override doDispose(): void {
    // 父 -> 子
    this.instance!.dispose()
    this.subView!.dispose()
    this.instance = null
  }
}

/**
 * 组件实例类，用于管理和维护组件的运行时状态。
 *
 * 核心功能：
 * - 管理组件的生命周期（初始化、显示、隐藏、销毁）
 * - 处理组件的副作用和依赖收集
 * - 管理组件的视图渲染和子视图
 * - 提供组件间的依赖注入和错误处理机制
 *
 * @template T - 组件类型，默认为 `Component`
 * @constructor
 * @param {ComponentView<T>} view - 组件视图对象，包含组件定义、属性、指令等信息
 *
 * @remarks
 * - ⚠️ 该类主要由框架内部使用，不应直接实例化！！！
 * - ⚠️ 所有方法皆为框架内部核心使用，开发者请勿随意使用！！！
 * - ⚠️ 所有属性面向开发者都是只读的，请勿随意修改！！！
 */
export class ComponentInstance<T extends Component = Component> {
  /** @internal - 应用 */
  public readonly app: App | null = null
  /** @internal - 父组件实例 */
  public readonly parent: ComponentInstance | null = null
  /** @internal - 组件注册的钩子 */
  public readonly hooks: HookStore = {}
  /** @internal - 组件的副作用管理作用域 */
  public readonly scope: EffectScope
  /** @internal - 组件公开实例，只读！*/
  public readonly publicInstance: ComponentPublicInstance
  /** @internal - 组件提供数据 */
  public provide: Map<string | symbol, any> | null = null
  /** @internal - 组件指令存储 */
  public directiveStore: Map<string, Directive> | null = null
  /** @internal - 根视图切换处理器 */
  public onViewSwitch: ViewSwitchHandler | null = null
  /** @internal - 异常处理器 */
  public errorHandler: ErrorHandler | null = null
  /** @internal - 组件的子视图 */
  public readonly subView: View
  /** @internal - 异步初始化 */
  public async?: Promise<unknown>
  /** @internal - 给子视图继承的上下文 */
  public readonly subViewContext: ViewContext
  constructor(public readonly view: ComponentView<T>) {
    this.parent = view.owner
    this.app = view.app
    this.scope = new EffectScope({
      name: view.name,
      errorHandler: (error, source) => {
        this.reportError(error, `effect:${source}`)
      }
    })
    this.publicInstance = markRaw({})
    const result = runComponent(this, () => view.component(view.props))
    this.subView = this.normalizeView(result)
    this.subViewContext = Object.freeze({
      owner: this,
      app: this.app
    })
    // 透传指令
    if (view.directives) withDirectives(this.subView, Array.from(view.directives))
  }
  public init(): void {
    const hooks = this.hooks[Lifecycle.init]
    if (!hooks) return void 0
    const errors: unknown[] = []
    const promises: Promise<unknown>[] = []
    for (const hook of hooks) {
      try {
        const result = hook.call(this.publicInstance)
        if (isPromise(result)) promises.push(result)
      } catch (e) {
        errors.push(e)
      }
    }
    delete this.hooks[Lifecycle.init]
    // 处理错误
    if (errors.length) {
      this.reportError(
        new AggregateError(errors, 'Lifecycle hook "init" execution failed'),
        'hook:init'
      )
    }
    if (!promises.length) return void 0
    const suspense = this.useSuspenseCounter()
    if (suspense) suspense.value++
    this.async = Promise.all(promises)
      .catch(e => {
        this.reportError(e, 'hook:init')
      })
      .finally(() => {
        if (suspense) suspense.value--
        delete this.async
      })
  }
  public beforeMount(): void {
    this.invokeVoidHook(Lifecycle.beforeMount)
    delete this.hooks[Lifecycle.beforeMount]
  }
  public mounted(): void {
    this.invokeVoidHook(Lifecycle.mounted)
    delete this.hooks[Lifecycle.mounted]
  }
  public show(): void {
    this.invokeVoidHook(Lifecycle.show)
  }
  public hide(): void {
    this.invokeVoidHook(Lifecycle.hide)
  }
  public dispose(): void {
    this.hide()
    this.invokeVoidHook(Lifecycle.dispose)
    delete this.hooks[Lifecycle.dispose]
    this.scope.dispose()
  }
  /**
   * 报告错误的方法
   *
   * @param error - 发生的错误对象
   * @param source - 错误来源
   * @param instance - 可选的组件实例，默认为当前实例
   */
  public reportError(error: unknown, source: ErrorSource, instance?: ComponentInstance): void {
    // 如果没有提供实例，则使用当前实例
    instance ??= this
    // 创建错误信息对象，包含错误来源和实例
    const errorInfo = { source, instance }
    // 检查是否存在错误处理器函数
    if (isFunction(this.errorHandler)) {
      try {
        // 调用错误处理器并获取结果
        const result = this.errorHandler(error, errorInfo)
        // 如果处理器返回false，则终止错误处理流程
        if (result === false) return
      } catch (e) {
        // 如果错误处理器本身抛出错误，记录无限循环错误
        logger.error(
          `[${this.view.name}] Infinite loop detected: error thrown in onError hook`,
          error
        )
      }
    }
    // 如果存在父组件，将错误上报给父组件
    if (this.parent) {
      this.parent.reportError(error, errorInfo.source, instance)
    } else if (this.app?.config.errorHandler) {
      this.app.config.errorHandler(error, errorInfo)
    } else {
      logger.error(`Unhandled exception in ${this.view.name} - `, error, errorInfo)
    }
  }
  private invokeVoidHook(stage: Exclude<Lifecycle, Lifecycle.init>): void {
    const hooks = this.hooks[stage]
    if (!hooks) return void 0
    const errors: unknown[] = []
    for (const hook of hooks) {
      try {
        hook()
      } catch (e) {
        errors.push(e)
      }
    }
    if (errors.length) {
      this.reportError(
        new AggregateError(errors, 'Lifecycle hook "' + stage + '" execution failed'),
        `hook:${stage}`
      )
    }
    if (stage === Lifecycle.dispose) delete this.hooks?.[stage]
  }
  /**
   * 规范化视图，将各种类型的子节点转换为标准的 View 对象
   *
   * 处理顺序：
   * 1. null/undefined/boolean - 转换为空组件注释
   * 2. View 对象 - 直接返回
   * 3. Ref 对象 - 包装为 DynamicView
   * 4. 字符串/数字 - 转换为 TextView 或空组件注释
   * 5. 其他类型 - 记录警告并返回错误注释
   *
   * @param child - 要规范化的子节点，可以是任意类型
   * @returns {View} - 规范化后的 View 对象
   * @throws {Error} 当转换过程中发生错误时抛出
   */
  private normalizeView(child: unknown): View {
    let view = resolveChild(child)
    if (view === null) {
      view = new CommentView(`Component<${this.view.name}>:empty`)
    }
    return view
  }
  private useSuspenseCounter(): Ref<number> | undefined {
    let parent = this.parent
    while (parent) {
      const suspense = parent.provide?.get(SUSPENSE_COUNTER)
      if (isRef(suspense)) return suspense
      parent = parent.parent
    }
    return undefined
  }
}
