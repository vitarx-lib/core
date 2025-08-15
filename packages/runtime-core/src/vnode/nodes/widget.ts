import {
  createScope,
  depSubscribe,
  EffectScope,
  getContext,
  runInContext,
  Subscriber
} from '@vitarx/responsive'
import { popProperty } from '@vitarx/utils'
import { DomHelper } from '../../dom/index'
import {
  type ErrorSource,
  type LifecycleHookParameter,
  type LifecycleHookReturnType,
  LifecycleHooks,
  type LifecycleState,
  Widget
} from '../../widget'
import { isRefEl } from '../ref'
import type {
  AnyElement,
  Child,
  FragmentElement,
  RuntimeElement,
  VNodeProps,
  WidgetType
} from '../types'
import { CommentVNode } from './comment'
import { FragmentVNode } from './fragment'
import { proxyWidgetProps } from './props'
import { VNode } from './vnode'

declare global {
  interface Window {
    __$VITARX_HMR$__?: {
      replaceNewModule: <T>(module: T) => T
    }
  }
}

const VNodeContextSymbol = Symbol('WidgetVNode Context Symbol')

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
 * - props: Record<string, any> - 传递给 Widget 组件的属性
 * - children: VNode[] - 子节点（可选）
 * - ref: Ref<Widget> - 用于引用 Widget 实例的响应式引用（可选）
 *
 * 注意事项：
 * - WidgetVNode 实例不能直接获取 DOM 元素，调用 element 属性会抛出错误
 * - 在开发环境中，会自动检查热模块替换(HMR)功能，确保组件使用最新的代码
 * - Widget 实例的创建是惰性的，只有在访问 instance 属性时才会创建
 * - 异步 Widget 组件的支持尚未完全实现
 */
export class WidgetVNode<T extends WidgetType = WidgetType> extends VNode<WidgetType> {
  /**
   * HMR热更新状态，仅在开发时由编译器注入
   */
  __$HMR_STATE$__?: Record<string, any>
  /**
   * 存储组件实例
   *
   * @private
   */
  #instance: Widget | null = null
  /**
   * 依赖提供
   *
   * @private
   */
  #provide: Record<string | symbol, any> | null = null
  /**
   * 用于缓存 build 方法的返回值
   */
  #child?: VNode
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
   * 影子占位元素
   *
   * @private
   */
  #shadowElement: RuntimeElement<'comment-node'> | null = null
  #children: VNodeProps<T>['children'] | undefined

  constructor(type: T, props: VNodeProps<T> | null = null, children: Child[] | null = null) {
    super(type, props)
    // 如果props中有children属性，合并到children
    const attrChildren = popProperty(this.props, 'children')
    if (attrChildren) {
      children = Array.isArray(attrChildren)
        ? [...attrChildren, ...(children ?? [])]
        : [attrChildren, ...(children ?? [])]
      this.#children = children.length === 1 ? children[0] : children
    }
    this.#children = undefined
  }

  /**
   * 获取子元素的访问器属性
   * 返回存储在私有字段 #children 中的子元素数组
   */
  get children() {
    return this.#children
  }

  /**
   * 获取 teleport 元素的 getter 方法
   * @returns {Element | null} 返回 teleport 元素，如果不存在则返回 null
   */
  get teleport(): Element | null {
    return this.#teleport
  }

  /**
   * 获取影子元素的getter方法
   * 返回一个运行时元素对象或null，该对象表示注释节点类型的运行时元素
   *
   * @returns {RuntimeElement<'comment-node'> | null} 返回影子元素，如果不存在则返回null
   */
  get shadowElement(): RuntimeElement<'comment-node'> {
    if (!this.#shadowElement) {
      this.#shadowElement = document.createComment(`${this.name} Shadow Element`)
    }
    return this.#shadowElement // 返回私有属性shadowElement的值
  }

  get state(): LifecycleState {
    return this.#state
  }

  get child(): VNode {
    if (!this.#child) {
      this.#child = this.#buildChild()
    }
    return this.#child
  }

  /**
   * 获取当前实例的子元素
   *
   * @returns {AnyElement} 返回子元素对象
   * @note 该方法会返回 this.instance.$child.element 的值
   */
  override get element(): AnyElement {
    return this.render()
  }

  /**
   * 获取Widget实例的getter方法
   * 如果实例不存在，则会创建一个新的实例
   *
   * @returns {Widget} 返回Widget实例
   */
  get instance(): Widget {
    // 检查实例是否已存在
    if (!this.#instance) {
      // 检查是否为开发环境
      if (import.meta.env?.MODE === 'development') {
        // 检查是否在浏览器环境中
        if (typeof window !== 'undefined') {
          // 避免未渲染的节点引用到旧模块，已渲染的节点会由 hmr 替换为最新模块
          const newModule = window.__$VITARX_HMR$__?.replaceNewModule?.(this.type)
          if (newModule) this.type = newModule
        }
      }
      // 创建作用域
      const scope = createScope({
        name: this.type.name,
        // 错误处理函数
        errorHandler: (e: unknown, source) => {
          this.reportWidgetError(e, {
            source: `effect.${source}`,
            instance: this.instance
          })
        }
      })
      // 在指定上下文中运行代码
      return scope.run(() =>
        runInContext(VNodeContextSymbol, this, () => {
          // 包装props为响应式对象
          this.props = proxyWidgetProps(this.props)
          // 异步实例
          if (Widget.isClassWidget(this.type)) {
            this.#instance = new this.type(this.props)
          } else {
            // TODO 创建异步小部件
            // _createFnWidget(vnode as VNode<FunctionWidget>).then()
          }
          // 绑定ref
          if (isRefEl(this.ref)) this.ref.value = this.instance
          return this.#instance!
        })
      )
    }
    return this.#instance!
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
   * 判断给定的虚拟节点是否为组件类型的虚拟节点
   *
   * @param vnode - 需要检查的虚拟节点
   * @returns {boolean} 如果虚拟节点是组件类型则返回 true，否则返回 false
   */
  static override is(vnode: VNode): vnode is WidgetVNode {
    // 检查虚拟节点的 type 属性是否为函数类型
    // 在虚拟 DOM 中，组件通常是一个函数或类
    return typeof vnode.type === 'function'
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
    return getContext<WidgetVNode>(VNodeContextSymbol)
  }

  getProvide<T = any>(name: string | symbol): T

  getProvide<T>(name: string | symbol, defaultValue: T): T

  getProvide<T = any>(name: string | symbol, defaultValue?: T): T {
    return this.#provide?.[name] ?? defaultValue
  }

  /**
   * 渲染小部件并返回对应的DOM元素
   *
   * @returns {AnyElement} 渲染后的DOM元素
   */
  render(): AnyElement {
    // 检查组件状态，如果已经渲染过则抛出错误
    if (this.state !== 'notRendered') {
      return this.child.element
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
        instance: this
      })
      // 如果渲染失败，则使用错误视图替换原视图
      this.#child = VNode.is(errVNode)
        ? errVNode
        : new CommentVNode(`${VNode.name} Widget render fail`)
      el = this.#child.element
    }
    // 更新组件状态为未挂载
    this.#state = 'notMounted'
    return el
  }

  /**
   * 挂载组件到指定容器
   * @param container - 可以是HTMLElement、SVGElement或FragmentElement类型的容器元素
   * @returns {this} 返回组件实例this，以便链式调用
   * @throws {Error} 如果组件非未挂载状态，则会抛出错误
   */
  override mount(container?: HTMLElement | SVGElement | FragmentElement): this {
    // 检查组件状态
    if (this.state === 'notRendered') {
      this.render()
    } else if (this.state !== 'notMounted') {
      throw new Error(
        '[Vitarx.WidgetRenderer.mount]：The component is not in the state of waiting to be mounted and cannot be mounted!'
      )
    }
    // 子节点挂载
    this.child.mount()
    // 处理DOM挂载
    const targetElement = this.#teleport || container
    const elementToMount = this.#teleport ? this.shadowElement : this.element

    if (targetElement) {
      // 如果目标元素存在，则将组件元素附加到目标元素
      DomHelper.appendChild(targetElement, elementToMount)
    } else if (this.#teleport && this.element.parentElement !== this.teleport) {
      // 如果目标元素不存在，但组件元素已经未附加到teleport目标，则挂载到teleport目标
      DomHelper.appendChild(this.#teleport, this.element)
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
        return this.reportWidgetError.apply(
          this,
          args as LifecycleHookParameter<LifecycleHooks.error>
        ) as LifecycleHookReturnType<T>
      }
      const method = this.instance[hook] as unknown as (...args: LifecycleHookParameter<T>) => any
      return typeof method === 'function' ? method.apply(null, args) : undefined
    } catch (e) {
      if (isCallOnError) {
        console.error(
          "[Vitarx.Widget.onError]：You can't keep throwing exceptions in the onError hook, this results in an infinite loop!"
        )
      } else {
        return this.reportWidgetError(e, {
          source: `hook:${hook.replace('on', '').toLowerCase()}` as ErrorSource,
          instance: this
        }) as LifecycleHookReturnType<T>
      }
    }
  }

  /**
   * 用于组件的卸载过程
   * 该方法会处理卸载前的状态检查、生命周期触发、子元素卸载等操作
   */
  override unmount() {
    // 检查当前状态是否允许卸载
    if (this.state === 'uninstalling' || this.state === 'unloaded') {
      return
    }
    // 设置状态为卸载中
    this.#state = 'uninstalling'
    // 触发onDeactivated生命周期
    this.triggerLifecycleHook(LifecycleHooks.beforeUnmount)
    // 异步卸载标志
    let isAsyncUnmount = false
    // 如果是根节点且是激活状态，则需要触发删除元素前的回调
    if (this.state === 'activated') {
      const result = this.triggerLifecycleHook(LifecycleHooks.beforeRemove, this.element, 'unmount')
      // 兼容异步卸载
      if (result instanceof Promise) {
        isAsyncUnmount = true
        result.finally(() => {
          this.#completeUnmount()
        })
      }
    }
    // 递归卸载子节点
    this.child.unmount()
    // 如果不是异步卸载直接执行卸载逻辑
    if (!isAsyncUnmount) this.#completeUnmount()
  }

  /**
   * 负责触发生命周期钩子函数
   *
   * @param args - 生命周期钩子参数，包含错误信息等相关数据
   * @return {VNode | void} VNode对象或void，用于渲染错误状态或执行错误处理逻辑
   */
  protected reportWidgetError(...args: LifecycleHookParameter<LifecycleHooks.error>): VNode | void {
    // 查找当前节点的父级虚拟节点
    let parentNode = VNode.findParentVNode(this)
    // 处理根节点错误
    if (!parentNode) {
      return this.#handleRootError(args)
    }
  }

  /**
   * 完成卸载流程的辅助方法
   */
  #completeUnmount(): void {
    // 执行卸载后续操作
    this.scope.dispose()
    this.#shadowElement?.remove()
    DomHelper.remove(this.element)
    this.#state = 'unloaded'
    this.triggerLifecycleHook(LifecycleHooks.unmounted)
  }

  /**
   * 构建子虚拟节点
   *
   * 该函数负责构建当前组件的子虚拟节点，并建立相应的依赖订阅关系。
   * 在构建过程中会处理异常情况，如果构建失败则会触发错误生命周期钩子。
   *
   * @returns {VNode} 返回构建好的虚拟节点
   */
  #buildChild(): VNode {
    // 如果已存在视图依赖订阅器，则先释放旧的订阅器
    if (this.#viewDepSubscriber) this.#viewDepSubscriber.dispose()

    // 订阅依赖并构建虚拟节点
    const { result, subscriber } = depSubscribe((): VNode => {
      let vnode: VNode
      try {
        // 执行构建逻辑
        const buildNode = this.instance.build()
        if (VNode.is(buildNode)) {
          vnode = buildNode
        } else {
          vnode = new FragmentVNode()
        }
      } catch (e) {
        // 处理构建过程中的异常
        const errVNode = this.triggerLifecycleHook(LifecycleHooks.error, e, {
          source: 'build',
          instance: this
        })
        // 如果构建出错，则使用错误虚拟节点
        vnode = VNode.is(errVNode) ? errVNode : new FragmentVNode()
      }

      // 建立父子虚拟节点的映射关系
      VNode.addParentVNodeMapping(vnode, this)
      return vnode
    }, this.#updateChild)

    // 更新订阅器
    this.#viewDepSubscriber = subscriber
    // 添加到作用域中
    if (subscriber) this.instance.$scope.addEffect(subscriber)
    return result
  }

  /**
   * 更新视图
   *
   * 更新视图不是同步的，会延迟更新，合并多个微任务。
   *
   * @param {VNode} newChildVNode - 新子节点，没有则使用`build`方法构建。
   * @return {void}
   */
  #updateChild(newChildVNode?: VNode): void {
    if (this.state === 'unloaded') {
      this.triggerLifecycleHook(
        LifecycleHooks.error,
        new Error(
          '[Vitarx.Widget.update]：The component is destroyed and the view can no longer be updated！'
        ),
        {
          source: 'update',
          instance: this
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
      // 使用 requestAnimationFrame 来延迟更新，合并多个微任务
      requestAnimationFrame(() => {
        this.#pendingUpdate = false
        // 如果组件已卸载，则不进行更新
        if (this.state === 'unloaded') return
        const oldVNode = this.child
        const newVNode = newChildVNode || this.#buildChild()
        this.#child = this.instance.patchUpdate(oldVNode, newVNode)
        // 触发更新后生命周期
        this.triggerLifecycleHook(LifecycleHooks.updated)
      })
    } catch (e) {
      this.#pendingUpdate = false
      throw e
    }
  }

  /**
   * 处理根节点错误的函数
   *
   * @param args - 错误处理函数的参数数组
   */
  #handleRootError(args: any[]): void {
    // 获取应用实例
    const app = this.getProvide('App')
    // 如果应用配置了错误处理函数，则调用该函数处理错误
    if (app?.config.errorHandler) {
      return app.config.errorHandler(...args)
    } else {
      // 如果没有配置错误处理函数，则在控制台输出错误信息
      console.error('[Vitarx]：there are unhandled exceptions', ...args)
    }
  }
}
