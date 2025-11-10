import type { DependencyMap } from '@vitarx/responsive'
import { depSubscribe, EffectScope, nextTick, Subscriber } from '@vitarx/responsive'
import { isPromise, logger } from '@vitarx/utils'
import { LifecycleHooks, NodeShapeFlags, NodeState } from '../../constants/index.js'
import {
  findParentNode,
  linkParentNode,
  proxyWidgetProps,
  runInNodeContext
} from '../../runtime/index.js'
import type {
  ErrorSource,
  HostNodeElements,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  MountType,
  NodeElementType,
  NodeNormalizedProps,
  StatefulWidgetNodeType,
  ValidNodeProps,
  WidgetInstanceType
} from '../../types/index.js'
import { __DEV__, isStatefulWidgetNode, isVNode } from '../../utils/index.js'
import { isClassWidget } from '../../utils/widget.js'
import { FnWidget, initializeFnWidget } from '../../widget/core/FnWidget.js'
import { VNode, type WaitNormalizedProps } from '../core/VNode.js'
import { WidgetNode } from '../core/WidgetNode.js'
import { CommentNode } from './CommentNode.js'
import { TextNode } from './TextNode.js'

/**
 * StatefulWidgetNode 是一个有状态组件节点类，继承自 WidgetNode。
 * 它管理着组件的生命周期、状态更新、依赖注入等核心功能。
 *
 * 主要功能：
 * - 管理组件实例的生命周期（创建、挂载、更新、卸载等）
 * - 处理组件的状态更新和视图渲染
 * - 提供依赖注入机制（provide/inject）
 * - 管理组件的作用域和错误处理
 * - 支持组件的激活和停用
 *
 * @example
 * ```typescript
 * // 创建一个有状态组件节点
 * const node = new StatefulWidgetNode(MyComponent, {
 *   props: { message: 'Hello' }
 * });
 *
 * // 挂载到DOM
 * node.mount(document.body);
 * ```
 *
 * @template T 组件类型，默认为 StatefulWidgetNodeType
 */
export class StatefulWidgetNode<
  T extends StatefulWidgetNodeType = StatefulWidgetNodeType
> extends WidgetNode<T> {
  public override shapeFlags = NodeShapeFlags.STATEFUL_WIDGET
  /**
   * 是否为异步组件
   *
   * 此属性在组件实例初始化之前默认为 false
   * 如果是异步组件在初始化后将会被设置为 true
   *
   * @readonly - 外部只读，请勿修改！
   */
  public isAsyncWidget = false
  /**
   * 依赖映射
   *
   * @readonly
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
   * 存储组件实例的私有对象
   *
   * @protected
   */
  private _instance: WidgetInstanceType<T> | null = null
  constructor(type: T, props: ValidNodeProps<T>) {
    super(type, props)
    if (this.appContext) this.provide('App', this.appContext)
  }
  /**
   * 获取Widget实例的单例属性
   * 如果实例不存在，则会创建一个新的实例
   * @returns {WidgetInstanceType<T>} 返回Widget实例
   */
  get instance(): WidgetInstanceType<T> {
    // 如果实例不存在，则调用createInstance方法创建实例，但不等待其完成
    if (!this._instance) {
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
        } else {
          // 创建函数组件实例
          const instance = new FnWidget(this.props)
          this._instance = instance as unknown as WidgetInstanceType<T>
          // 初始化函数组件并收集钩子
          const promise = initializeFnWidget(instance, StatefulWidgetNode)
          // 如果是异步组件且是服务端渲染，则将promise添加到appContext的renderPromises中
          if (this.isAsyncWidget && this.isServerRender && isPromise(promise)) {
            this.appContext?.registerRenderPromise?.(promise)
          }
        }
        // 绑定ref引用
        if (this.ref) this.ref.value = this._instance
      })
    }
    return this._instance! // 返回实例，使用非空断言操作符(!)告诉编译器this._instance不为null或undefined
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
        // 错误处理函数
        errorHandler: (e: unknown, source) => {
          this.reportError(e, {
            source: `effect.${source}`,
            instance: this.instance
          })
        }
      }))
    }
    // 如果已存在，直接返回现有作用域实例
    return this._scope
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
   * 向下提供注入值
   *
   * @param name 注入名称
   * @param value 注入的值
   */
  provide(name: string | symbol, value: any): void {
    // 如果当前没有提供者对象，则创建一个新的
    if (!this._provide) {
      this._provide = new Map()
    }
    this._provide.set(name, value)
  }
  /**
   * 获取注入值的方法
   *
   * @template T - 注入值的类型
   * @param name - 要获取的注入值的名称，可以是字符串或symbol类型
   * @param defaultValue - 可选参数，当指定名称的注入值不存在时返回的默认值
   * @returns {T} 返回获取到的注入值，如果不存在则返回默认值
   */
  inject<T = any>(name: string | symbol, defaultValue?: T): T {
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
   * 重写渲染方法，用于渲染组件实例
   *
   * @returns {NodeElementType<T>} 返回根元素实例
   */
  override render(): NodeElementType<T> {
    // 检查组件状态，如果已经渲染过则抛出错误
    if (this.state !== NodeState.Created) {
      return this.child.element as NodeElementType<T>
    }
    // 触发render生命周期钩子，在组件渲染时执行
    const promise = this.callHook(LifecycleHooks.render)
    if (this.isServerRender && isPromise(promise) && !this.isAsyncWidget) {
      // 仅注册同步组件渲染任务，因为异步组件在创建实例时就已添加异步渲染任务，不应该使用 onRender 钩子进行额外的请求数据
      this.appContext?.registerRenderPromise?.(promise.then(() => this.syncSilentUpdate()))
    }
    // 触发beforeMount生命周期钩子，在组件挂载前执行
    this.callHook(LifecycleHooks.beforeMount)
    let el: NodeElementType
    try {
      // 尝试获取子组件的DOM元素
      el = this.child.element
    } catch (e) {
      // 触发onError生命周期钩子，处理渲染过程中发生的错误
      const errVNode = this.reportError(e, {
        source: 'render', // 错误来源为渲染过程
        instance: this.instance // 当前实例
      })
      // 如果渲染失败，则使用错误视图替换原视图
      // 如果返回的是有效的VNode节点，则使用该节点
      // 否则创建一个注释节点作为错误提示
      this._child = isVNode(errVNode)
        ? errVNode
        : new CommentNode({ value: `StatefulWidget<${VNode.name}> render fail` })
      // 获取更新后的DOM元素
      el = this.child.element
    }
    this.state = NodeState.Rendered
    // 返回渲染后的宿主元素实例
    return el as NodeElementType<T>
  }
  /**
   * @inheritDoc
   */
  override mount(target?: HostNodeElements, type?: MountType): this {
    // 未渲染调用this.element渲染一次元素
    if (this.state === NodeState.Created) this.render()
    super.mount(target, type)
    this.callHook(LifecycleHooks.mounted)
    this.callHook(LifecycleHooks.activated)
    return this
  }
  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Deactivated) return
    // 1️⃣ 先调用父节点自己的激活逻辑
    this.updateActiveState(true, root)
    this.scope.resume()
    // 2️⃣ 再激活子节点（父 → 子顺序）
    this.child.activate(false)
    // 3️⃣ 触发一次更新逻辑，避免停用期间状态变化导致视图未更新问题
    this.syncSilentUpdate()
    this.callHook(LifecycleHooks.activated)
  }
  /**
   * 静默补丁更新
   *
   * 在不触发生命周期钩子或异步调度的情况下，
   * 同步执行节点的补丁更新操作。
   */
  public syncSilentUpdate(): void {
    // 定义同步静默更新方法，无返回值
    try {
      // 如果节点状态不是已渲染或有父元素
      this._child = this.instance.$patchUpdate(this.child, this.rebuild()) // 直接执行补丁更新
    } catch (e) {
      // 捕获可能发生的错误
      this.reportError(e, {
        // 报告错误
        source: 'update', // 错误来源标识为更新操作
        instance: this.instance // 相关的实例引用
      })
    }
  }
  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== NodeState.Activated) return
    // 1️⃣ 先调用根节点的停用逻辑（子 → 父顺序）
    this.child.deactivate(false)
    // 2️⃣ 触发 onDeactivated 生命周期
    this.callHook(LifecycleHooks.deactivated)
    // 3️⃣ 暂停作用域
    this.scope.pause()
    // 4️⃣ 再调用父节点自己的停用逻辑（更新状态）
    this.updateActiveState(false, root)
  }
  /**
   * @inheritDoc
   */
  override unmount(): void {
    // 检查当前状态是否允许卸载
    if (this.state === NodeState.Unmounted) {
      throw new Error(`the node is already ${this.state}`)
    }
    // 触发onDeactivated生命周期
    this.callHook(LifecycleHooks.deactivated)
    // 递归卸载子节点
    this.child.unmount()
    // 停止作用域
    this.scope.dispose()
    if (this.state !== NodeState.Deactivated) {
      // 修改状态为已停用
      this.state = NodeState.Deactivated
      // 触发onBeforeUnmount生命周期
      this.callHook(LifecycleHooks.beforeUnmount)
    }
    // 修改状态为已卸载
    this.state = NodeState.Unmounted
    // 触发onUnmounted生命周期
    this.callHook(LifecycleHooks.unmounted)
    this._scope = null
    this._child = null
    this._instance = null
    this._provide = null
    this._pendingUpdate = false
    this.deps = null
  }
  /**
   * 负责触发错误处理器钩子函数
   *
   * @param args - 生命周期钩子参数，包含错误信息等相关数据
   * @return {VNode | void} VNode对象或void，用于渲染错误状态或执行错误处理逻辑
   */
  public reportError(...args: LifecycleHookParameter<LifecycleHooks.error>): VNode | void {
    try {
      // 首先检查实例上是否存在自定义错误处理器
      if (typeof this.instance.onError === 'function') {
        // 如果存在，则调用该错误处理器并返回结果
        const result = this.instance.onError.apply(this.instance, args)
        if (result === false) return void 0
        if (isVNode(result)) return result
      }
      // 如果没有自定义错误处理器，则开始查找父级组件
      let parentNode = findParentNode(this)
      // 遍历父级组件树，直到找到最近的WidgetVNode或到达根节点
      while (parentNode && !isStatefulWidgetNode(parentNode)) {
        parentNode = findParentNode(parentNode)
      }
      // 如果没有找到任何父级WidgetVNode，则处理根级错误
      if (!parentNode) {
        if (this.appContext?.config?.errorHandler) {
          return this.appContext.config.errorHandler.apply(this.instance, args)
        } else {
          logger.error('there are unhandled exceptions', ...args)
          return void 0
        }
      }
      // 如果找到父级WidgetVNode，则将错误向上传递给该父级组件处理
      if (isStatefulWidgetNode(parentNode)) {
        return parentNode.reportError(...args)
      }
    } catch (e) {
      logger.error(
        `StatefulWidget<${this.name}> You can't keep throwing exceptions in the onError hook, this results in an infinite loop!`,
        e
      )
    }
  }
  /**
   * 更新视图
   *
   * 更新视图不是同步的，会延迟更新，合并多个微任务。
   *
   * 仅在活跃状态下才执行更新逻辑
   *
   * @return {void}
   */
  public readonly update = (): void => {
    if (this.state === NodeState.Unmounted) {
      this.reportError(
        new Error(
          `The StatefulWidget<${this.name}> is destroyed and the view can no longer be updated!`
        ),
        {
          source: 'update',
          instance: this.instance
        }
      )
    }
    // 如果状态是不活跃的，则不进行更新操作，会在下一次激活时执行更新操作
    if (this.state === NodeState.Deactivated) return
    if (this.state === NodeState.Rendered) {
      this.syncSilentUpdate()
      return
    }
    // 如果是挂起的更新，则直接返回
    if (this._pendingUpdate) return
    this._pendingUpdate = true
    try {
      // 触发更新前生命周期
      this.callHook(LifecycleHooks.beforeUpdate)
      // 使用 nextTick 来延迟更新，合并多个微任务
      nextTick(() => {
        this._pendingUpdate = false
        // 如果组件已卸载，则不进行更新
        if (this.state === NodeState.Unmounted) return
        const oldVNode = this.child
        const newVNode = this.rebuild()
        if (!this.show) newVNode.show = false
        this._child = this.instance.$patchUpdate(oldVNode, newVNode)
        // 触发更新后生命周期
        this.callHook(LifecycleHooks.updated)
      })
    } catch (e) {
      this._pendingUpdate = false
      this.reportError(e, {
        source: 'update',
        instance: this.instance
      })
    }
  }
  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @private
   */
  public callHook<T extends LifecycleHooks>(
    hook: T,
    ...args: LifecycleHookParameter<T>
  ): LifecycleHookReturnType<T> | void {
    try {
      // 处理错误钩子的未处理情况
      if (hook === LifecycleHooks.error) {
        return this.reportError.apply(
          this,
          args as LifecycleHookParameter<LifecycleHooks.error>
        ) as LifecycleHookReturnType<T>
      }
      // 忽略服务端渲染时调用非render钩子
      if (this.isServerRender && hook !== LifecycleHooks.render) return
      const method = this.instance[hook] as unknown as (...args: LifecycleHookParameter<T>) => any
      return typeof method === 'function' ? method.apply(this.instance, args) : undefined
    } catch (e) {
      return this.reportError(e, {
        source: `hook:${hook.replace('on', '').toLowerCase()}` as ErrorSource,
        instance: this.instance
      }) as LifecycleHookReturnType<T>
    }
  }

  /**
   * 重新构建根节点
   *
   * 该函数负责构建当前组件的子虚拟节点，并建立相应的依赖订阅关系。
   * 在构建过程中会处理异常情况，如果构建失败则会触发错误生命周期钩子。
   *
   * @returns {VNode} 返回构建好的虚拟节点
   */
  protected override rebuild(): VNode {
    // 如果已存在视图依赖订阅器，则先释放旧的订阅器
    if (this._viewDepSubscriber) this._viewDepSubscriber.dispose()

    // 订阅依赖并构建虚拟节点
    const { result, subscriber, deps } = depSubscribe(this.buildChildNode, this.update, {
      scope: false
    })
    // 开发模式记录依赖
    if (__DEV__) this.deps = deps
    // 更新订阅器
    this._viewDepSubscriber = subscriber
    // 添加到作用域中
    if (subscriber) this.instance.$scope.addEffect(subscriber)
    return result
  }
  /**
   * @inheritDoc
   */
  protected override initProps(props: WaitNormalizedProps<T>): NodeNormalizedProps<T> {
    return props as NodeNormalizedProps<T>
  }
  /**
   * 构建子视图节点
   *
   * @returns {VNode} 返回构建的虚拟节点
   */
  private readonly buildChildNode = (): VNode => {
    let vnode: VNode // 声明虚拟节点变量
    try {
      // 执行构建逻辑
      const buildNode = this.appContext
        ? this.appContext.runInContext(() => this.instance.build()) // 在应用上下文中运行构建逻辑
        : this.instance.build() // 调用实例的build方法
      if (isVNode(buildNode)) {
        // 如果构建结果是VNode实例，则直接使用
        vnode = buildNode
      } else {
        const t = typeof buildNode
        if (t === 'string' || t === 'number') {
          vnode = new TextNode({ value: String(buildNode) })
        } else {
          // 如果构建结果不是VNode，则创建错误注释节点
          vnode = new CommentNode({ value: `StatefulWidget<${this.name}> build ${String(t)}` })
        }
      }
    } catch (e) {
      // 处理构建过程中的异常
      // 触发生命周期错误钩子
      const errVNode = this.reportError(e, {
        source: 'build',
        instance: this.instance
      })
      // 如果构建出错，则使用错误虚拟节点
      vnode = isVNode(errVNode)
        ? errVNode
        : new CommentNode({ value: `StatefulWidget<${this.name}> build fail` })
    }

    // 建立父子虚拟节点的映射关系
    linkParentNode(vnode, this)
    return vnode // 返回构建的虚拟节点
  }
}
