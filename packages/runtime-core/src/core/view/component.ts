import { EffectScope, isRef, markRaw, type Ref } from '@vitarx/responsive'
import { isFunction, isNumber, isPromise, isString, logger } from '@vitarx/utils'
import { App } from '../../app/index.js'
import { Lifecycle, SUSPENSE_COUNTER, ViewKind } from '../../constants/index.js'
import { runComponent, withDirectives } from '../../runtime/index.js'
import { isView } from '../../shared/index.js'
import type {
  AnyProps,
  CodeLocation,
  Component,
  ComponentProps,
  Directive,
  DirectiveMap,
  ErrorHandler,
  ErrorSource,
  HookStore,
  HostContainer,
  HostNode,
  InstanceRef,
  MountType,
  PublicComponentInstance,
  View,
  ViewContext,
  ViewSwitchHandler
} from '../../types/index.js'
import { applyRef, mergeDefaultProps, resolveProps } from '../compiler/resolve.js'
import { CommentView, TextView } from './atomic.js'
import { BaseView } from './base.js'
import { SwitchView } from './switch.js'

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
export class ComponentView<T extends Component = Component> extends BaseView<ViewKind.COMPONENT> {
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
  constructor(
    component: T,
    props: ComponentProps<T> | null = null,
    key?: unknown,
    location?: CodeLocation
  ) {
    super(key, location)
    this.component = component
    const { props: inputProps, ref } = resolveProps(props)
    this.ref = ref
    const resolvedProps: AnyProps = mergeDefaultProps(inputProps, component.defaultProps)
    // 开发时直接冻结
    if (__DEV__) Object.freeze(resolvedProps)
    if (isFunction(component.validateProps)) {
      component.validateProps(resolvedProps)
    }
    this.props = resolvedProps
  }
  get $node(): HostNode | null {
    return this.instance?.subView.$node ?? null
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
  protected override doMount(containerOrAnchor: HostContainer | HostNode, type: MountType) {
    // 父 -> 子
    this.instance!.beforeMount()
    if (this.ref) applyRef(this.ref, this.instance!.publicInstance)
    this.subView!.mount(containerOrAnchor, type)
    // 子 -> 父
    this.instance!.mounted()
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
  /** @internal - 组件展示的名称 */
  public readonly name: string
  /** @internal - 应用 */
  public readonly app: App | null = null
  /** @internal - 父组件实例 */
  public readonly parent: ComponentInstance | null = null
  /** @internal - 组件注册的钩子 */
  public readonly hooks: HookStore = {}
  /** @internal - 组件的副作用管理作用域 */
  public readonly scope: EffectScope
  /** @internal - 组件公开实例，只读！*/
  public readonly publicInstance: PublicComponentInstance
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
  /** @internal - 组件是否可见 */
  private _visible = false
  constructor(public readonly view: ComponentView<T>) {
    this.name = view.component.displayName ?? view.component.name ?? 'anonymous'
    this.parent = view.owner
    this.app = view.app
    this.scope = new EffectScope({
      name: this.name,
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
  /** 组件是否处于可见状态 */
  public get isVisible(): boolean {
    return this._visible
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
    delete this.hooks[Lifecycle.mounted]
  }
  public mounted(): void {
    this.invokeVoidHook(Lifecycle.mounted)
    delete this.hooks[Lifecycle.mounted]
    this.show()
  }
  public show(): void {
    if (this._visible) return
    this._visible = true
    this.invokeVoidHook(Lifecycle.show)
  }
  public hide(): void {
    if (!this._visible) return
    this._visible = false
    this.invokeVoidHook(Lifecycle.hide)
  }
  public dispose(): void {
    this.hide()
    this.invokeVoidHook(Lifecycle.dispose)
    delete this.hooks[Lifecycle.dispose]
    this.scope.dispose()
  }
  private reportError(error: unknown, source: ErrorSource, instance?: ComponentInstance): void {
    instance ??= this
    const errorInfo = { source, instance }
    if (isFunction(this.errorHandler)) {
      try {
        const result = this.errorHandler(error, errorInfo)
        if (result === false) return
      } catch (e) {
        logger.error(`[${this.name}] Infinite loop detected: error thrown in onError hook`, error)
      }
    }
    if (this.parent) {
      this.parent.reportError(error, errorInfo.source, instance)
    } else if (this.app?.config.errorHandler) {
      this.app.config.errorHandler.call(this.publicInstance, error, errorInfo)
    } else {
      logger.error(`Unhandled exception in ${this.name}: `, error, errorInfo)
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
  private normalizeView(child: unknown): View {
    // 直接处理当前项，避免重复的类型检查
    if (child == null || typeof child === 'boolean') return new CommentView('v-if')
    // 直接进行类型判断，减少函数调用开销
    if (isView(child)) return child
    // 引用
    if (isRef(child)) return new SwitchView(child)
    // DEV 下给警告
    if (!isString(child) && !isNumber(child)) {
      const message = `[Component<${this.name}>] Component returned unsupported value type`
      if (__DEV__) logger.warn(message, child)
      return new CommentView(message)
    }
    return new TextView(String(child))
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
