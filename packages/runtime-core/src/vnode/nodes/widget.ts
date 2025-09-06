import {
  createScope,
  depSubscribe,
  EffectScope,
  Subscriber,
  withAsyncContext
} from '@vitarx/responsive'
import { isPromise, nextTick } from '@vitarx/utils'
import { DomHelper } from '../../dom/index.js'
// noinspection ES6PreferShortImport
import { getSuspenseCounter } from '../../widget/built/suspense-counter.js'
import { __WIDGET_INTRINSIC_KEYWORDS__, LifecycleHooks } from '../../widget/constant.js'
import { isClassWidget } from '../../widget/helper.js'
import { HookCollector } from '../../widget/hook.js'
import type {
  BuildVNode,
  ErrorSource,
  FunctionWidget,
  HookCollectResult,
  LifecycleHookMethods,
  LifecycleHookParameter,
  LifecycleHookReturnType,
  LifecycleState,
  WidgetInstance
} from '../../widget/index.js'
import { Widget } from '../../widget/widget.js'
import { getCurrentVNode, runInNodeContext } from '../context.js'
import { isVNode, isWidgetVNode } from '../guards.js'
import { proxyWidgetProps } from '../props.js'
import { isRefEl } from '../ref.js'
import type { AnyElement, RuntimeElement, VNodeProps, WidgetType } from '../types/index.js'
import { CommentVNode } from './comment.js'
import { VNode } from './vnode.js'

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
const __INITIALIZE_FN_WIDGET__ = Symbol('__INITIALIZE_FN_WIDGET__')

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
 * - type: WidgetType - 指定要创建的 Widget 组件类型
 * - props: Record<string, any> - 传递给 Widget 组件的属性，和固有的属性
 *
 * 注意事项：
 * - 在开发环境中，会自动检查热模块替换(HMR)功能，确保组件使用最新的代码
 * - Widget 实例的创建是惰性的，只有在访问 instance 属性时才会创建
 */
export class WidgetVNode<T extends WidgetType = WidgetType> extends VNode<T> {
  /**
   * HMR热更新状态，仅在开发时由编译器注入
   */
  __$HMR_STATE$__?: Record<string, any>
  /**
   * 存储组件实例
   *
   * @private
   */
  #instance: WidgetInstance<T> | null = null
  /**
   * 依赖提供
   *
   * @private
   */
  #provide: Record<string | symbol, any> | null = null
  /**
   * 用于缓存 build 方法的返回值
   */
  #child: VNode | null = null
  /**
   * 生命周期状态
   * @private
   */
  #state: LifecycleState = 'notRendered'
  /**
   * 视图依赖订阅实例
   *
   * @private
   */
  #viewDepSubscriber?: Subscriber
  /**
   * 等待更新标识
   * @private
   */
  #pendingUpdate: boolean = false
  /**
   * 传送的目标元素
   *
   * @private
   */
  #teleport: Element | null = null

  /**
   * 获取子元素的访问器属性
   * 返回存储在私有字段 #children 中的子元素数组
   */
  get children() {
    return this.props.children
  }

  /**
   * 获取 teleport 元素的 getter 方法
   * @returns {Element | null} 返回 teleport 元素，如果不存在则返回 null
   */
  get teleport(): Element | null {
    return this.#teleport
  }

  get state(): LifecycleState {
    return this.#state
  }

  get child(): VNode {
    if (!this.#child) {
      this.#child = this.#build()
    }
    return this.#child
  }

  /**
   * 获取当前实例的子元素
   *
   * @returns {AnyElement} 返回子元素对象
   * @note 该方法会返回 this.instance.$child.element 的值
   */
  override get element(): RuntimeElement<T> {
    return this.render()
  }

  /**
   * 获取Widget实例的getter方法
   * 如果实例不存在，则会创建一个新的实例
   *
   * @returns {Widget} 返回Widget实例
   */
  get instance(): WidgetInstance<T> {
    // 检查实例是否已存在
    if (!this.#instance) {
      // 创建作用域
      const scope = createScope({
        name: this.type.name,
        // 错误处理函数
        errorHandler: (e: unknown, source) => {
          this.reportError(e, {
            source: `effect.${source}`,
            instance: this.instance
          })
        }
      })
      // 在指定上下文中运行代码
      return scope.run(() =>
        this.runInContext(() => {
          // 包装props为响应式对象
          this.props = proxyWidgetProps(this.props) as VNodeProps<T>
          // 异步实例
          if (isClassWidget(this.type)) {
            this.#instance = new this.type(this.props) as WidgetInstance<T>
          } else {
            const instance = new FnWidget(this.props)
            this.#instance = instance as unknown as WidgetInstance<T>
            instance[__INITIALIZE_FN_WIDGET__](
              HookCollector.collect(this as WidgetVNode<FunctionWidget>, instance)
            )
          }
          // 绑定ref
          if (isRefEl(this.ref)) this.ref.value = this.#instance
          return this.#instance!
        })
      )
    }
    return this.#instance!
  }

  /**
   * 获取当前的虚拟节点对象
   *
   * 该函数通过上下文符号从当前执行上下文中获取WidgetVNode实例，
   * 用于在组件树中追踪当前正在处理的虚拟节点。
   *
   * @returns {WidgetVNode | undefined} 返回当前上下文中的WidgetVNode实例，如果不存在则返回undefined
   */
  static getCurrentVNode(): WidgetVNode | undefined {
    return getCurrentVNode()
  }
  /**
   * 获取当前实例的scope属性
   * 这是一个getter方法，用于访问内部实例的scope属性
   * @returns {EffectScope} 返回内部实例的scope属性
   */
  get scope(): EffectScope {
    return this.instance.$scope
  }
  /**
   * 判断给定的值是否为组件类型的虚拟节点
   *
   * @param val - 要检查的虚拟节点
   * @returns {boolean} 如果虚拟节点是组件类型则返回 true，否则返回 false
   */
  static override is(val: any): val is WidgetVNode {
    return isWidgetVNode(val)
  }

  /**
   * 在指定上下文中执行函数
   *
   * @template R - 函数返回值的类型
   * @param {() => R} fn - 需要在特定上下文中执行的函数
   * @returns {R} 函数执行后的返回值
   */
  runInContext<R>(fn: () => R): R {
    // 调用runInContext函数，传入虚拟节点上下文符号、当前对象和要执行的函数
    return runInNodeContext(this, fn)
  }
  /**
   * 获取提供（provide）的值
   * @template T - 泛型参数，指定返回值的类型，默认为 any
   * @param {string | symbol} name - 要获取的提供值的名称，可以是字符串或 Symbol 类型
   * @param {T} [defaultValue] - 可选参数，当指定的名称不存在时返回的默认值
   * @returns {T} 返回获取到的提供值，如果不存在则返回默认值
   */
  getProvide<T = any>(name: string | symbol, defaultValue?: T): T {
    // 使用可选链操作符访问 provide 对象的属性，如果不存在则返回默认值
    return this.#provide?.[name] ?? defaultValue
  }
  /**
   * 设置提供者方法
   * @param name - 提供者的名称，可以是字符串或symbol类型
   * @param value - 提供者对应的值，可以是任意类型
   */
  provide(name: string | symbol, value: any) {
    // 如果当前没有提供者对象，则创建一个新的
    if (!this.#provide) {
      this.#provide = { [name]: value }
    } else {
      // 如果已存在提供者对象，则直接添加或更新属性
      this.#provide[name] = value
    }
  }
  /**
   * 检查是否提供了指定的名称或符号
   * @param name - 要检查的名称或符号，可以是字符串或类型
   * @returns - 如果提供了指定的名称或符号则返回true，否则返回false
   */
  hasProvide(name: string | symbol) {
    // 定义一个名为hasProvide的方法，接受一个字符串或类型的参数
    return this.#provide?.hasOwnProperty(name) ?? false // 使用可选链操作符检查this.#provide是否存在hasOwnProperty属性，如果存在则检查是否包含指定的name，否则返回false
  }
  /**
   * 渲染小部件并返回对应的DOM元素
   *
   * @returns {AnyElement} 渲染后的DOM元素
   */
  render(): RuntimeElement<T> {
    // 检查组件状态，如果已经渲染过则抛出错误
    if (this.state !== 'notRendered') {
      return this.child.element as RuntimeElement<T>
    }
    // 触发beforeMount生命周期钩子，获取可能的传送目标
    const teleport = this.triggerLifecycleHook(LifecycleHooks.beforeMount)
    // 处理传送目标，可以是选择器字符串或元素
    if (typeof teleport === 'string') {
      // 如果是字符串，则使用querySelector查找对应元素
      this.#teleport = document.querySelector(teleport)
    } else if (teleport instanceof Element) {
      // 如果是元素实例，直接使用
      this.#teleport = teleport
    }
    let el: AnyElement
    try {
      // 尝试获取子组件的DOM元素
      el = this.child.element
    } catch (e) {
      // 触发onError生命周期
      const errVNode = this.triggerLifecycleHook(LifecycleHooks.error, e, {
        source: 'render',
        instance: this.instance
      })
      // 如果渲染失败，则使用错误视图替换原视图
      this.#child = VNode.is(errVNode)
        ? errVNode
        : new CommentVNode(`${VNode.name} Widget render fail`)
      el = this.#child.element
    }
    // 更新组件状态为未挂载
    this.#state = 'notMounted'
    return el as RuntimeElement<T>
  }
  /**
   * 挂载组件到指定容器
   * @param container - 可以是HTMLElement、SVGElement或FragmentElement类型的容器元素
   * @returns {this} 返回组件实例this，以便链式调用
   * @throws {Error} 如果组件非未挂载状态，则会抛出错误
   */
  override mount(container?: ParentNode): this {
    // 检查组件状态
    if (this.state === 'notRendered') {
      this.render()
    } else if (this.state !== 'notMounted') {
      throw new Error(
        '[Vitarx.WidgetRenderer.mount]：The component is not in the state of waiting to be mounted and cannot be mounted!'
      )
    }
    // 子节点挂载，挂载到传送目标/容器
    this.child.mount(this.#teleport || container)
    if (container && this.#teleport) {
      // 如果指定了容器，则将影子元素挂载到容器
      DomHelper.appendChild(container, this.shadowElement)
    }
    // 更新状态并触发生命周期
    this.#state = 'activated'
    this.triggerLifecycleHook(LifecycleHooks.mounted)
    this.triggerLifecycleHook(LifecycleHooks.activated)

    return this
  }
  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @protected
   */
  triggerLifecycleHook<T extends LifecycleHooks>(
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
        console.error(
          "[Vitarx.Widget.onError]：You can't keep throwing exceptions in the onError hook, this results in an infinite loop!",
          e
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
   * 将元素追加的父元素，仅进行DOM操作，不触发 mounted生命周期钩子
   *
   * @param container - 父节点，用于挂载组件的容器
   */
  appendToContainer(container: ParentNode): void {
    const parent = this.#teleport || container
    // 将元素挂载到父元素
    DomHelper.appendChild(parent, this.element)
    // 如果指定了容器，则将影子元素挂载到容器
    if (this.#teleport) DomHelper.appendChild(container, this.shadowElement)
  }
  /**
   * 用于组件的卸载过程
   * 该方法会处理卸载前的状态检查、生命周期触发、子元素卸载等操作
   */
  override unmount(root: boolean = true) {
    // 检查当前状态是否允许卸载
    if (this.state === 'uninstalling' || this.state === 'unloaded') {
      throw new Error(`[Vitarx.WidgetVNode.unmount]：The widget is already ${this.state}`)
    }
    // 设置状态为卸载中
    this.#state = 'uninstalling'
    // 触发onBeforeUnmount生命周期
    this.triggerLifecycleHook(LifecycleHooks.beforeUnmount)
    // 异步卸载标志
    let isAsyncUnmount = false
    // 如果是根节点且是激活状态，则需要触发删除元素前的回调
    if (root && this.state === 'activated') {
      const result = this.triggerLifecycleHook(LifecycleHooks.beforeRemove, this.element, 'unmount')
      // 兼容异步卸载
      if (result instanceof Promise) {
        isAsyncUnmount = true
        result.finally(this.#completeUnmount)
      }
    }
    // 递归卸载子节点
    this.child.unmount(root && !isAsyncUnmount)
    // 如果不是异步卸载直接执行卸载逻辑
    if (!isAsyncUnmount) this.#completeUnmount()
  }
  /**
   * @inheritDoc
   */
  override activate(root: boolean = true): void {
    if (this.state === 'deactivated') {
      this.#state = 'activated'
      if (root) {
        if (this.teleport) {
          // 将元素重新插入到传送目标
          this.teleport.appendChild(this.element)
        } else {
          // 将元素重新插入到影子元素
          DomHelper.replace(this.element, this.shadowElement)
        }
      }
      // 恢复作用域
      this.scope.resume()
      // 更新视图
      this.updateChild()
      // 触发onActivated生命周期
      this.triggerLifecycleHook(LifecycleHooks.activated)
      // 激活子节点
      this.child.activate(false)
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
  updateChild(newChildVNode?: VNode): void {
    if (this.state === 'unloaded') {
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
    if (newChildVNode && !VNode.is(newChildVNode)) {
      throw new TypeError(
        `The new child node must be a valid VNode object, given: ${typeof newChildVNode}`
      )
    }
    // 如果状态是不活跃的，则不进行更新操作，会在下一次激活时执行更新操作
    if (this.#state === 'deactivated') return
    // 如果是挂起的更新，则直接返回
    if (this.#pendingUpdate) return
    this.#pendingUpdate = true
    try {
      // 触发更新前生命周期
      this.triggerLifecycleHook(LifecycleHooks.beforeUpdate)
      // 使用 nextTick 来延迟更新，合并多个微任务
      nextTick(() => {
        this.#pendingUpdate = false
        // 如果组件已卸载，则不进行更新
        if (this.state === 'unloaded') return
        const oldVNode = this.child
        const newVNode = newChildVNode || this.#build()
        this.#child = this.instance.$patchUpdate(oldVNode, newVNode)
        // 触发更新后生命周期
        this.triggerLifecycleHook(LifecycleHooks.updated)
      })
    } catch (e) {
      this.#pendingUpdate = false
      throw e
    }
  }

  /**
   * 构建子虚拟节点的方法
   *
   * @returns {VNode} 返回构建的虚拟节点
   */
  #buildChild(): VNode {
    let vnode: VNode // 声明虚拟节点变量
    try {
      // 执行构建逻辑
      const buildNode = this.instance.build() // 调用实例的build方法
      if (buildNode === null) {
        // 如果构建结果为null，则创建注释节点
        vnode = new CommentVNode(`Widget(${this.name}) build null`)
      } else if (VNode.is(buildNode)) {
        // 如果构建结果是VNode实例，则直接使用
        vnode = buildNode
      } else {
        // 如果构建结果不是VNode，则创建错误注释节点
        vnode = new CommentVNode(
          `The return value of the Widget(${this.name}) build is not a VNode`
        )
      }
    } catch (e) {
      // 处理构建过程中的异常
      // 触发生命周期错误钩子
      const errVNode = this.triggerLifecycleHook(LifecycleHooks.error, e, {
        source: 'build',
        instance: this.instance
      })
      // 如果构建出错，则使用错误虚拟节点
      vnode = VNode.is(errVNode) ? errVNode : new CommentVNode(`${this.name} Widget build fail`)
    }

    // 建立父子虚拟节点的映射关系
    VNode.addParentVNodeMapping(vnode, this)
    return vnode // 返回构建的虚拟节点
  }
  /**
   * 构建子虚拟节点
   *
   * 该函数负责构建当前组件的子虚拟节点，并建立相应的依赖订阅关系。
   * 在构建过程中会处理异常情况，如果构建失败则会触发错误生命周期钩子。
   *
   * @returns {VNode} 返回构建好的虚拟节点
   */
  #build(): VNode {
    // 如果已存在视图依赖订阅器，则先释放旧的订阅器
    if (this.#viewDepSubscriber) this.#viewDepSubscriber.dispose()

    // 订阅依赖并构建虚拟节点
    const { result, subscriber } = depSubscribe(
      this.#buildChild.bind(this),
      this.updateChild.bind(this),
      {
        scope: false
      }
    )

    // 更新订阅器
    this.#viewDepSubscriber = subscriber
    // 添加到作用域中
    if (subscriber) this.instance.$scope.addEffect(subscriber)
    return result
  }
  /**
   * 处理根节点错误的函数
   *
   * @param args - 错误处理函数的参数数组
   */
  #handleRootError(args: any[]): void {
    // 首先尝试获取当前 App 实例
    let app = this.getProvide('App')

    // 如果没有 App 实例，则查找根节点并获取 App 实例
    if (!app) {
      // 获取根节点
      let root: VNode = this
      while (true) {
        const parent = VNode.findParentVNode(root)
        if (!parent) break
        root = parent
      }
      // 如果根节点是 WidgetVNode，获取其 App 实例
      if (WidgetVNode.is(root)) {
        app = root.getProvide('App')
      }
    }

    // 处理错误
    if (app?.config?.errorHandler) {
      app.config.errorHandler(...args)
    } else {
      console.error('[Vitarx]：there are unhandled exceptions', ...args)
    }
  }

  /**
   * @inheritDoc
   */
  override deactivate(root: boolean = true): void {
    // 如果当前状态不是已激活，则直接返回
    if (this.state !== 'activated') return
    // 设置状态为停用中
    this.#state = 'deactivating'
    // 递归停用子节点
    this.child.deactivate(false)
    // 如果是根节点，且不是传送节点，则将影子元素插入到元素之前
    if (root && !this.teleport) {
      DomHelper.insertBefore(this.shadowElement, this.element)
    }
    const post = () => {
      // 如果是根节点，则移除元素
      if (root) DomHelper.remove(this.element)
      this.scope.pause()
      this.#state = 'deactivated'
      // 触发onDeactivated生命周期
      this.triggerLifecycleHook(LifecycleHooks.deactivated)
    }
    // 触发beforeRemove生命周期钩子，获取返回值
    const result = this.triggerLifecycleHook(
      LifecycleHooks.beforeRemove,
      this.element,
      'deactivate'
    )
    if (result instanceof Promise) {
      result.finally(post)
    } else {
      post()
    }
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
    let parentNode = VNode.findParentVNode(this)
    // 遍历父级组件树，直到找到最近的WidgetVNode或到达根节点
    while (parentNode && !WidgetVNode.is(parentNode)) {
      parentNode = VNode.findParentVNode(parentNode)
      if (!parentNode) break
    }
    // 如果没有找到任何父级WidgetVNode，则处理根级错误
    if (!parentNode) return this.#handleRootError(args)
    // 如果找到父级WidgetVNode，则将错误向上传递给该父级组件处理
    if (WidgetVNode.is(parentNode)) return parentNode.reportError(...args)
  }
  /**
   * 完成卸载流程的辅助方法
   */
  #completeUnmount(): void {
    // 执行卸载后续操作
    this.scope.dispose()
    this.removeShadowElement()
    // 移除元素
    if (this.element.parentNode) DomHelper.remove(this.element)
    this.#state = 'unloaded'
    this.triggerLifecycleHook(LifecycleHooks.unmounted)
  }

  /**
   * 更新模块的方法
   *
   * 仅提供给HMR使用
   *
   * @param module - 需要更新的模块对象，类型为泛型T
   * @param resetState - 是否重置状态
   */
  private updateModule(module: T, resetState: boolean = false) {
    if (import.meta.env?.MODE === 'development') {
      // 设置当前实例的类型为传入的模块
      this.type = module
      this.#instance?.$scope?.dispose()
      // 将实例变量重置为null，以便下次使用时重新创建
      this.#instance = null
      if (resetState) {
        this.#teleport = null
        this.removeShadowElement()
        this.#child = null
        this.#state = 'notRendered'
      }
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
  async [__INITIALIZE_FN_WIDGET__](data: HookCollectResult): Promise<FnWidget> {
    // 注入暴露的属性和方法
    this.#injectExposed(data.exposed)
    const exposedCount = Object.keys(data.exposed).length
    // 注入生命周期钩子到实例中
    this.#injectLifeCycleHooks(data.lifeCycleHooks)
    const hookCount = Object.keys(data.lifeCycleHooks).length
    let build: BuildVNode | VNode | null | { default: WidgetType } = data.build as BuildVNode
    if (isPromise(data.build)) {
      // 如果有上级暂停计数器则让计数器+1
      if (this.#suspenseCounter) this.#suspenseCounter.value++
      try {
        build = await withAsyncContext(data.build as Promise<BuildVNode>)
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

  /**
   * @inheritDoc
   */
  override build(): VNode | null {
    return null
  }

  /**
   * 更新视图的方法
   * 根据组件的状态决定是否执行更新操作
   */
  #updateView() {
    // 检查组件状态是否为未挂载或激活状态
    if (this.$vnode.state === 'notMounted' || this.$vnode.state === 'activated') {
      // 如果条件满足，则执行更新操作
      this.update()
    }
  }

  /**
   * 初始化函数小部件
   *
   * @param {BuildVNode} build - 构建函数
   * @private
   */
  #setBuild(build: BuildVNode | VNode | null | { default: WidgetType }) {
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
      this.build = () => new WidgetVNode(build.default, this.props)
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
      if (__WIDGET_INTRINSIC_KEYWORDS__.includes(exposedKey as any)) continue
      if (!(exposedKey in this)) (this as any)[exposedKey] = exposed[exposedKey]
    }
  }
}
