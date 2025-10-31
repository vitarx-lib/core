import type { DependencyMap } from '@vitarx/responsive'
import {
  depSubscribe,
  EffectScope,
  nextTick,
  Subscriber,
  withAsyncContext
} from '@vitarx/responsive'
import { isPromise } from '@vitarx/utils'
import { logger } from '@vitarx/utils/src/index.js'
import type {
  BindParentElement,
  Child,
  ErrorSource,
  FunctionWidget,
  HostElementInstance,
  HostParentElement,
  LazyWidgetModule,
  LifecycleHookMethods,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  MountType,
  NodeNormalizedProps,
  ViewBuilder,
  WidgetInstanceType,
  WidgetType
} from '../../types/index.js'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks } from '../../widget/constant.js'
import {
  getSuspenseCounter,
  HookCollector,
  type HookCollectResult,
  isClassWidget
} from '../../widget/index.js'
import { Widget } from '../../widget/widget.js'
import { VNode, type WaitNormalizedProps } from '../base/index.js'
import { NodeShapeFlags, NodeState } from '../constants/index.js'
import {
  findParentNode,
  linkParentNode,
  proxyWidgetProps,
  runInNodeContext
} from '../runtime/index.js'
import { isVNode } from '../utils/index.js'
import { CommentNode } from './CommentNode.js'
import { TextNode } from './TextNode.js'

declare global {
  interface Window {
    __$VITARX_HMR$__?: {
      replaceNewModule: <T>(module: T) => T
    }
  }
}

/**
 * 初始化函数组件的标识符
 */
const __INITIALIZE_FN_WIDGET_METHOD__ = Symbol('__INITIALIZE_FN_WIDGET_METHOD__')

/**
 * WidgetVNode 类是一个扩展自 VNode<WidgetType> 的虚拟节点实现，专门用于表示和管理 Widget 类型的组件实例。
 *
 * 核心功能：
 * - 管理 Widget 组件的生命周期和实例化
 * - 提供作用域上下文管理，确保组件在正确的环境中执行
 * - 处理组件间的依赖注入和属性传递
 * - 支持热模块替换(HMR)功能，在开发环境中自动更新组件
 * - 提供错误处理机制，捕获并报告组件运行时错误
 *
 * 使用示例：
 * ```typescript
 * // 创建一个WidgetVNode实例
 * const widgetVNode = new WidgetVNode(MyWidgetComponent, { props: { title: "Hello" } });
 *
 * // 获取Widget实例
 * const widgetInstance = widgetVNode.instance;
 *
 * // 获取注入的值
 * const value = widgetVNode.getProvide('someKey', 'defaultValue');
 * ```
 *
 * 构造函数参数：
 * - types: WidgetType - 指定要创建的 Widget 组件类型
 * - props: Record<string, any> - 传递给 Widget 组件的属性，和固有的属性
 *
 * 注意事项：
 * - 在开发环境中，会自动检查热模块替换(HMR)功能，确保组件使用最新的代码
 * - Widget 实例的创建是惰性的，只有在访问 instance 属性时才会创建
 */
export class WidgetNode<T extends WidgetType = WidgetType> extends VNode<T> {
  public override shapeFlags = NodeShapeFlags.WIDGET
  /**
   * HMR热更新状态，仅在开发时由编译器注入
   */
  __$HMR_STATE$__?: Record<string, any>
  /**
   * 依赖映射
   *
   * @private
   */
  public deps: DependencyMap | null = null
  /**
   * 存储提供者数据的私有对象
   * 键为字符串或符号，值为任意类型
   *
   * @protected
   */
  private _provide: Map<string | symbol, any> | null = null
  /**
   * 视图依赖订阅实例
   *
   * @private
   */
  private _viewDepSubscriber?: Subscriber
  /**
   * 等待更新标识
   * @private
   */
  private _pendingUpdate: boolean = false
  /**
   * 存储子节点的私有对象
   *
   * @private
   */
  private _rootNode: VNode | null = null

  /**
   * 获取子虚拟节点(VNode)的getter方法
   * 使用懒加载模式，仅在首次访问时构建子节点
   * @returns {VNode} 返回构建后的子虚拟节点
   */
  get rootNode(): VNode {
    // 如果子节点尚未构建，则调用构建方法创建子节点
    if (!this._rootNode) {
      this._rootNode = this.rebuild()
    }
    // 返回已构建的子节点
    return this._rootNode
  }

  /**
   * 存储组件实例的私有对象
   *
   * @protected
   */
  private _instance: WidgetInstanceType<T> | null = null

  get instance(): WidgetInstanceType<T> {
    if (!this._instance) this.createInstance().then()
    return this._instance!
  }

  /**
   * 存储组件实例作用域的私有对象
   *
   * @private
   */
  private _scope: EffectScope | null = null

  /**
   * 获取效果作用域（EffectScope）的访问器
   * 如果作用域尚未创建，则会创建一个新的作用域实例
   * @returns {EffectScope} 返回效果作用域实例
   */
  get scope(): EffectScope {
    // 检查是否已经存在作用域实例
    if (!this._scope) {
      // 如果不存在，则创建一个新的作用域实例
      // 配置包括名称和错误处理器
      return (this._scope = new EffectScope({
        name: this.name, // 使用当前实例的名称作为作用域名称
        errorHandler: (instance, args) => {} // 空的错误处理器函数
      }))
    }
    // 如果已存在，直接返回现有作用域实例
    return this._scope
  }

  /**
   * 创建组件实例的方法
   *
   * 此方法每次都会创建一个新的组件实例，并返回一个Promise，解析为创建的组件实例。
   *
   * 建议通过this.instance getter 访问组件实例，此方法的存在仅为了兼容SSR渲染。
   *
   * @returns {Promise<Widget>} 返回一个Promise，解析为创建的组件实例
   */
  createInstance(): Promise<WidgetInstanceType<T>> {
    return new Promise(resolve => {
      // 在特定上下文中运行实例创建逻辑
      this.runInContext(() => {
        // 包装props为响应式对象
        this.props = proxyWidgetProps(
          this.props,
          this.type['defaultProps']
        ) as NodeNormalizedProps<T>
        // 判断是否为类组件
        if (isClassWidget(this.type)) {
          // 创建类组件实例
          this._instance = new this.type(this.props) as WidgetInstanceType<T>
          resolve(this._instance!)
        } else {
          // 创建函数组件实例
          const instance = new FnWidget(this.props)
          this._instance = instance as unknown as WidgetInstanceType<T>
          // 初始化函数组件并收集钩子
          instance[__INITIALIZE_FN_WIDGET_METHOD__](
            HookCollector.collect(this as WidgetNode<FunctionWidget>, instance)
          ).then(() => resolve(this._instance!))
        }
        // 绑定ref引用
        if (this.ref) this.ref.value = this._instance
      })
    })
  }

  /**
   * 在指定上下文中执行函数
   *
   * @template R - 函数返回值的类型
   * @param {() => R} fn - 需要在特定上下文中执行的函数
   * @returns {R} 函数执行后的返回值
   */
  runInContext<R>(fn: () => R): R {
    return this.scope.run(() => runInNodeContext(this, fn))
  }

  /**
   * 向子组件提供数据或方法
   * @param name 提供者的标识符，可以是字符串或符号
   * @param value 要提供的值，可以是任意类型
   */
  provide(name: string | symbol, value: any): void {
    // 如果当前没有提供者对象，则创建一个新的
    if (!this._provide) {
      this._provide = new Map()
    }
    this._provide.set(name, value)
  }

  /**
   * 获取提供者提供的值
   * @param name 要获取的提供者标识符
   * @param defaultValue 当提供者不存在时返回的默认值
   * @returns { any } 返回提供者提供的值，如果不存在则返回默认值
   */
  getProvide<T = any>(name: string | symbol, defaultValue?: T): T {
    // 使用可选链操作符访问 provide 对象的属性，如果不存在则返回默认值
    return this._provide?.get(name) ?? defaultValue
  }

  /**
   * 检查是否存在指定的提供者
   * @param name 要检查的提供者标识符
   * @returns 如果提供者存在返回 true，否则返回 false
   */
  hasProvide(name: string | symbol): boolean {
    // 使用可选链操作符和 hasOwnProperty 方法检查属性是否存在
    return this._provide?.has(name) ?? false
  }

  /**
   * @inheritDoc
   */
  override get element(): HostElementInstance<T> {
    // 检查组件状态，如果已经渲染过则抛出错误
    if (this.state !== NodeState.Created) {
      return this.rootNode.element as HostElementInstance<T>
    }
    // 触发beforeMount生命周期钩子
    this.triggerLifecycleHook(LifecycleHooks.beforeMount)
    let el: HostElementInstance
    try {
      // 尝试获取子组件的DOM元素
      el = this.rootNode.element
    } catch (e) {
      // 触发onError生命周期
      const errVNode = this.triggerLifecycleHook(LifecycleHooks.error, e, {
        source: 'render',
        instance: this.instance
      })
      // 如果渲染失败，则使用错误视图替换原视图
      this._rootNode = isVNode(errVNode)
        ? errVNode
        : new CommentNode({ value: `${VNode.name} Widget render fail` })
      el = this.rootNode.element
    }
    return el as HostElementInstance<T>
  }
  /**
   * 负责触发错误处理器钩子函数
   *
   * @param args - 生命周期钩子参数，包含错误信息等相关数据
   * @return {VNode | void} VNode对象或void，用于渲染错误状态或执行错误处理逻辑
   */
  reportError(...args: LifecycleHookParameter<LifecycleHooks.error>): VNode | void {
    // 首先检查实例上是否存在自定义错误处理器
    if (this.instance.onError) {
      // 如果存在，则调用该错误处理器并返回结果
      return this.instance.onError.apply(this.instance, args)
    }
    // 如果没有自定义错误处理器，则开始查找父级组件
    let parentNode = findParentNode(this)
    // 遍历父级组件树，直到找到最近的WidgetVNode或到达根节点
    while (parentNode && !(parentNode instanceof WidgetNode)) {
      parentNode = findParentNode(parentNode)
      if (!parentNode) break
    }
    // 如果没有找到任何父级WidgetVNode，则处理根级错误
    if (!parentNode) return this.handleRootError(args)
    // 如果找到父级WidgetVNode，则将错误向上传递给该父级组件处理
    if (parentNode instanceof WidgetNode) return parentNode.reportError(...args)
  }
  /**
   * @inheritDoc
   */
  override activate(root: boolean): void {
    super.updateActiveState(true, root, () =>
      // 激活子节点
      this.rootNode.activate(false)
    )
    // 恢复作用域
    this.scope.resume()
    // 更新视图
    this.updateChild()
    // 触发onActivated生命周期
    this.triggerLifecycleHook(LifecycleHooks.activated)
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Activated) return
    // 停用作用域
    this.scope.pause()
    // 触发onDeactivated生命周期
    this.triggerLifecycleHook(LifecycleHooks.deactivated)
    // 递归停用子节点
    this.rootNode.deactivate(false)
    // 更新激活状态
    this.updateActiveState(false, root)
  }
  /**
   * @inheritDoc
   */
  override unmount(root?: boolean): void {
    // 检查当前状态是否允许卸载
    if (this.state === NodeState.Unmounted) {
      throw new Error(`the node is already ${this.state}`)
    }
    // 触发onDeactivated生命周期
    this.triggerLifecycleHook(LifecycleHooks.deactivated)
    // 修改状态为已停用
    this.state = NodeState.Deactivated
    // 触发onBeforeUnmount生命周期
    this.triggerLifecycleHook(LifecycleHooks.beforeUnmount)
    // 递归卸载子节点
    this.rootNode.unmount(root)
    // 停止作用域
    this.scope.dispose()
    // 修改状态为已卸载
    this.state = NodeState.Unmounted
    // 触发onUnmounted生命周期
    this.triggerLifecycleHook(LifecycleHooks.unmounted)
  }
  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @private
   */
  private triggerLifecycleHook<T extends LifecycleHooks>(
    hook: T,
    ...args: LifecycleHookParameter<T>
  ): LifecycleHookReturnType<T> | void {
    const isCallOnError = hook === LifecycleHooks.error
    try {
      // 处理错误钩子的未处理情况
      if (isCallOnError) {
        return this.reportError.apply(
          this,
          args as LifecycleHookParameter<LifecycleHooks.error>
        ) as LifecycleHookReturnType<T>
      }
      const method = this.instance[hook] as unknown as (...args: LifecycleHookParameter<T>) => any
      return typeof method === 'function' ? method.apply(this.instance, args) : undefined
    } catch (e) {
      if (isCallOnError) {
        logger.error(
          `Widget(${this.name}) You can't keep throwing exceptions in the onError hook, this results in an infinite loop!`,
          e,
          this.devInfo
        )
      } else {
        return this.reportError(e, {
          source: `hook:${hook.replace('on', '').toLowerCase()}` as ErrorSource,
          instance: this.instance
        }) as LifecycleHookReturnType<T>
      }
    }
  }
  /**
   * @inheritDoc
   */
  override mount(target?: HostParentElement, type?: MountType): this {
    // 未渲染调用this.element渲染一次元素
    if (this.state === NodeState.Created) this.element
    if (this.teleport) {
      if (target) {
        // 插入影子元素
        switch (type) {
          case 'insertBefore':
            this.dom.insertBefore(this.anchor, target)
            break
          case 'insertAfter':
            this.dom.insertAfter(this.anchor, target)
            break
          case 'replace':
            this.dom.replace(this.anchor, target)
            break
          default:
            this.dom.appendChild(target, this.anchor)
        }
      }
      this.rootNode.mount(this.teleport, 'appendChild')
    } else {
      this.rootNode.mount(target, type)
    }
    // 更新状态并触发生命周期
    this.state = NodeState.Activated
    this.triggerLifecycleHook(LifecycleHooks.mounted)
    this.triggerLifecycleHook(LifecycleHooks.activated)
    return this
  }
  /**
   * @inheritDoc
   */
  override setTeleport(teleport: BindParentElement) {
    const prevTeleport = this.teleport
    super.setTeleport(teleport)
    const nextTeleport = this.teleport

    // 仅在已激活状态下处理 DOM 迁移
    if (this.state !== NodeState.Activated) return

    const rootElement = this.rootNode.operationTarget
    if (!rootElement) return

    // 如果传送目标没有变化，则不需要任何操作
    if (prevTeleport === nextTeleport) return

    // --- 1️⃣ 清空 teleport：恢复到原始位置 ---
    if (prevTeleport && !nextTeleport) {
      this.dom.replace(rootElement, this.anchor)
      return
    }

    // --- 2️⃣ 新增 teleport：从原位置传送到新容器 ---
    if (!prevTeleport && nextTeleport) {
      this.dom.replace(this.anchor, rootElement)
      this.dom.appendChild(nextTeleport, rootElement)
      return
    }

    // --- 3️⃣ 切换 teleport：从旧容器迁移到新容器 ---
    if (prevTeleport && nextTeleport) {
      this.dom.appendChild(nextTeleport, rootElement)
      return
    }
  }
  /**
   * 更新模块的方法
   *
   * 仅提供给HMR使用
   *
   * @param module - 需要更新的模块对象，类型为泛型T
   * @param resetState - 是否重置状态
   */
  public updateWidgetModule(module: T, resetState: boolean = false) {
    if (import.meta.env?.DEV) {
      // 设置当前实例的类型为传入的模块
      this.type = module
      // 将实例变量重置为null，以便下次使用时重新创建
      this._instance = null
      if (resetState) {
        if (this._scope) {
          this._scope?.dispose()
          this._scope = null
        }
        this._rootNode = null
        this._viewDepSubscriber = undefined
        this._provide = null
        this.state = NodeState.Created
      }
    }
  }
  /**
   * 更新视图
   *
   * 更新视图不是同步的，会延迟更新，合并多个微任务。
   *
   * @param {VNode} newChildVNode - 新子节点，没有则使用`build`方法构建。
   * @return {void}
   */
  readonly updateChild = (newChildVNode?: VNode): void => {
    if (this.state === NodeState.Unmounted) {
      this.triggerLifecycleHook(
        LifecycleHooks.error,
        new Error(
          '[Vitarx.Widget.update]：The widget is destroyed and the view can no longer be updated！'
        ),
        {
          source: 'update',
          instance: this.instance
        }
      )
    }
    if (newChildVNode && !isVNode(newChildVNode)) {
      throw new TypeError(
        `The new child node must be a valid VNode object, given: ${typeof newChildVNode}`
      )
    }
    // 如果状态是不活跃的，则不进行更新操作，会在下一次激活时执行更新操作
    if (this.state === NodeState.Deactivated) return
    // 如果是挂起的更新，则直接返回
    if (this._pendingUpdate) return
    this._pendingUpdate = true
    try {
      // 触发更新前生命周期
      this.triggerLifecycleHook(LifecycleHooks.beforeUpdate)
      // 使用 nextTick 来延迟更新，合并多个微任务
      nextTick(() => {
        this._pendingUpdate = false
        // 如果组件已卸载，则不进行更新
        if (this.state === NodeState.Unmounted) return
        const oldVNode = this.rootNode
        const newVNode = newChildVNode || this.rebuild()
        this._rootNode = this.instance.$patchUpdate(oldVNode, newVNode)
        // 触发更新后生命周期
        this.triggerLifecycleHook(LifecycleHooks.updated)
      })
    } catch (e) {
      this._pendingUpdate = false
      throw e
    }
  }
  /**
   * @inheritDoc
   */
  protected override handleShowState(is: boolean): void {
    this.rootNode.show = is
  }
  /**
   * @inheritDoc
   */
  protected override normalizeProps(props: WaitNormalizedProps<T>): NodeNormalizedProps<T> {
    return props as NodeNormalizedProps<T>
  }

  /**
   * 构建子视图节点
   *
   * @returns {VNode} 返回构建的虚拟节点
   */
  private readonly buildViewNode = (): VNode => {
    let vnode: VNode // 声明虚拟节点变量
    try {
      // 执行构建逻辑
      const buildNode = this.instance.build() // 调用实例的build方法
      if (isVNode(buildNode)) {
        // 如果构建结果是VNode实例，则直接使用
        vnode = buildNode
      } else {
        const t = typeof buildNode
        if (t === 'string' || t === 'number') {
          vnode = new TextNode({ value: String(buildNode) })
        }
        // 如果构建结果不是VNode，则创建错误注释节点
        vnode = new CommentNode({ value: `${this.name} widget build ${String(t)}` })
      }
    } catch (e) {
      // 处理构建过程中的异常
      // 触发生命周期错误钩子
      const errVNode = this.triggerLifecycleHook(LifecycleHooks.error, e, {
        source: 'build',
        instance: this.instance
      })
      // 如果构建出错，则使用错误虚拟节点
      vnode = isVNode(errVNode)
        ? errVNode
        : new CommentNode({ value: `${this.name} Widget build fail` })
    }

    // 建立父子虚拟节点的映射关系
    linkParentNode(vnode, this)
    return vnode // 返回构建的虚拟节点
  }

  /**
   * 重新构建子节点
   *
   * 该函数负责构建当前组件的子虚拟节点，并建立相应的依赖订阅关系。
   * 在构建过程中会处理异常情况，如果构建失败则会触发错误生命周期钩子。
   *
   * @returns {VNode} 返回构建好的虚拟节点
   */
  private rebuild(): VNode {
    // 如果已存在视图依赖订阅器，则先释放旧的订阅器
    if (this._viewDepSubscriber) this._viewDepSubscriber.dispose()

    // 订阅依赖并构建虚拟节点
    const { result, subscriber, deps } = depSubscribe(this.buildViewNode, this.updateChild, {
      scope: false
    })
    if (import.meta.env?.DEV) {
      // 如果是开发模式，则记录依赖关系，用于调试
      this.deps = deps
    }
    // 更新订阅器
    this._viewDepSubscriber = subscriber
    // 添加到作用域中
    if (subscriber) this.instance.$scope.addEffect(subscriber)
    return result
  }

  /**
   * 处理根节点错误的函数
   *
   * @param args - 错误处理函数的参数数组
   */
  private handleRootError(args: any[]): void {
    // 首先尝试获取当前 App 实例
    let app = this.getProvide('App')

    // 如果没有 App 实例，则查找根节点并获取 App 实例
    if (!app) {
      // 获取根节点
      let root: VNode = this
      while (true) {
        const parent = findParentNode(root)
        if (!parent) break
        root = parent
      }
      // 如果根节点是 WidgetVNode，获取其 App 实例
      if (root instanceof WidgetNode) {
        app = root.getProvide('App')
      }
    }

    // 处理错误
    if (app?.config?.errorHandler) {
      app.config.errorHandler(...args)
    } else {
      logger.error('there are unhandled exceptions', ...args)
    }
  }
}

/**
 * FnWidget 是一个函数式组件小部件类，继承自 Widget 基类，用于支持函数式组件的渲染和生命周期管理。
 *
 * 该类提供了以下核心功能：
 * - 支持异步初始化函数小部件
 * - 支持生命周期钩子的注入和管理
 * - 支持暴露属性和方法的注入
 * - 支持多种构建函数类型（函数、VNode、Promise等）
 *
 * 使用示例：
 * ```typescript
 * const widget = new FnWidget();
 * await widget[__INITIALIZE_FN_WIDGET__](data);
 * ```
 *
 * 构造函数参数：
 * - 无需直接实例化，通过调用 __INITIALIZE_FN_WIDGET__ 方法进行初始化
 *
 * @param data - 初始化数据对象，包含以下属性：
 *   - exposed: 需要暴露到实例的属性和方法
 *   - lifeCycleHooks: 生命周期钩子集合
 *   - build: 构建函数，可以是函数、VNode、Promise或包含default导出的对象
 *
 * 注意事项：
 * - build 属性支持多种类型，但必须是 VNode、返回 VNode 的函数、Promise<{ default: 函数组件/类组件 }> 或 null
 * - 如果 build 是 Promise，会自动处理异步情况
 * - 内部关键字（__WIDGET_INTRINSIC_KEYWORDS__）不会被注入到实例中
 *
 * @template T - 组件属性类型，继承自 Widget 基类
 */
class FnWidget extends Widget<Record<string, any>> {
  #suspenseCounter = getSuspenseCounter()
  /**
   * 初始化函数小部件
   *
   * @param data
   */
  async [__INITIALIZE_FN_WIDGET_METHOD__](data: HookCollectResult): Promise<FnWidget> {
    // 注入暴露的属性和方法
    this.#injectExposed(data.exposed)
    const exposedCount = Object.keys(data.exposed).length
    // 注入生命周期钩子到实例中
    this.#injectLifeCycleHooks(data.lifeCycleHooks)
    const hookCount = Object.keys(data.lifeCycleHooks).length
    let build: ViewBuilder | VNode | null | LazyWidgetModule = data.build as ViewBuilder
    if (isPromise(data.build)) {
      // 如果有上级暂停计数器则让计数器+1
      if (this.#suspenseCounter) this.#suspenseCounter.value++
      try {
        build = await withAsyncContext(data.build as Promise<ViewBuilder>)
      } catch (e) {
        // 让build方法抛出异常
        build = () => {
          throw e
        }
      } finally {
        this.#setBuild(build)
        // 如果有新增钩子则重新注入生命周期钩子
        if (hookCount !== Object.keys(data.lifeCycleHooks).length) {
          this.#injectLifeCycleHooks(data.lifeCycleHooks)
        }
        // 如果组件有新增暴露的属性和方法，则重新注入到实例中
        if (exposedCount !== Object.keys(data.exposed).length) {
          this.#injectExposed(data.exposed)
        }
        this.#updateView()
        // 如果有上级暂停计数器则让计数器-1
        if (this.#suspenseCounter) this.#suspenseCounter.value--
      }
    } else {
      this.#setBuild(build)
      this.#updateView()
    }
    return this
  }

  override build(): Child {
    return undefined
  }

  /**
   * 更新视图的方法
   * 根据组件的状态决定是否执行更新操作
   */
  #updateView() {
    // 检查组件状态是否为未挂载或激活状态
    if (this.$vnode.state === NodeState.Rendered || this.$vnode.state === NodeState.Activated) {
      // 如果条件满足，则执行更新操作
      this.$forceUpdate()
    }
  }

  /**
   * 初始化函数小部件
   *
   * @param {ViewBuilder} build - 构建函数
   * @private
   */
  #setBuild(build: ViewBuilder | VNode | null | LazyWidgetModule) {
    // 如果是函数，则直接赋值给build方法
    if (typeof build === 'function') {
      this.build = build
      return
    }
    // 如果是vnode，则让build方法返回节点
    if (isVNode(build)) {
      this.build = () => build
      return
    }
    if (build === null) return
    // 如果是module对象，则判断是否存在default导出
    if (typeof build === 'object' && 'default' in build! && typeof build.default === 'function') {
      this.build = () => new WidgetNode(build.default, this.props)
      return
    }
    // 如果不符合要求，则在build方法中抛出异常
    this.build = () => {
      throw new Error(
        `[Vitarx.FnWidget]：函数组件的返回值必须是VNode、()=>VNode、Promise<{ default: 函数组件/类组件 }>、null，实际返回的却是${typeof build}`
      )
    }
  }

  /**
   * 注入生命周期钩子到实例中
   *
   * @param lifeCycleHooks
   */
  #injectLifeCycleHooks(lifeCycleHooks: HookCollectResult['lifeCycleHooks']) {
    for (const lifeCycleHook in lifeCycleHooks) {
      const k = lifeCycleHook as LifecycleHookMethods
      this[k] = lifeCycleHooks[k]
    }
  }

  /**
   * 将暴露的属性和方法注入到实例中
   *
   * @param exposed
   */
  #injectExposed(exposed: HookCollectResult['exposed']) {
    for (const exposedKey in exposed || {}) {
      if (__WIDGET_INTRINSIC_KEYWORDS__.has(exposedKey)) continue
      if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
    }
  }
}
