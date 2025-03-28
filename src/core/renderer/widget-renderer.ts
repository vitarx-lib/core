import {
  createVNode,
  createWidgetVNodeInstance,
  Fragment,
  isVNode,
  updateParentVNodeMapping,
  type VNode,
  type WidgetType
} from '../vnode/index.js'
import {
  getElParentNode,
  insertBeforeExactly,
  mountVNode,
  patchUpdate,
  removeElement,
  renderElement,
  replaceElement,
  unmountVNode,
  updateActivateState
} from './web-runtime-dom/index.js'
import { type HookParameter, type HookReturnType, LifeCycleHooks, Widget } from '../widget/index.js'
import { Observers } from '../observer/index.js'
import { type Scope } from '../scope/index.js'
import type { ContainerElement } from './types/index.js'
import { Depend } from '../responsive/index.js'
import { _WidgetViewDependListener } from './view_depend_listener.js'
import { _callLifeCycleHook } from '../widget/internal.js'

/**
 * 渲染状态
 *
 * - notRendered：未渲染
 * - notMounted：未挂载
 * - activated：活跃
 * - deactivating：停用中
 * - deactivated：不活跃
 * - uninstalling：卸载中
 * - unloaded：已卸载
 */
export type RenderState =
  | 'notRendered'
  | 'notMounted'
  | 'activated'
  | 'deactivating'
  | 'deactivated'
  | 'uninstalling'
  | 'unloaded'

/**
 * 小部件渲染器
 *
 * 用于渲染小部件，和管理小部件的生命周期。
 */
export class WidgetRenderer<T extends Widget> {
  /**
   * 渲染器状态
   *
   * @protected
   */
  protected _state: RenderState = 'notRendered'
  /**
   * 等待更新
   *
   * @protected
   */
  protected _pendingUpdate = false
  /**
   * 影子占位元素
   *
   * @protected
   */
  protected _shadowElement: Comment | null = null
  /**
   * 当前组件的Child虚拟节点
   *
   * @protected
   */
  protected _child: VNode
  /**
   * 小部件实例
   *
   * @protected
   */
  protected _widget: T
  /**
   * 监听器
   *
   * @protected
   */
  protected _viewDependListener: _WidgetViewDependListener

  constructor(widget: T) {
    this._widget = widget
    this._viewDependListener = new _WidgetViewDependListener(() => this.update())
    this.scope.add(this._viewDependListener)
    this._child = this.build()
  }

  /**
   * 获取影子元素
   *
   * 仅传送节点和被挂起的顶层节点使用影子节点记录其所在位置。
   */
  get shadowElement(): Comment {
    if (!this._shadowElement) {
      this._shadowElement = document.createComment(`${this.name} Shadow Element`)
    }
    return this._shadowElement
  }

  /**
   * 当前小部件的`child`虚拟节点
   *
   * @returns {VNode}
   */
  get child(): VNode {
    return this._child
  }

  /**
   * 传送的目标元素
   *
   * @protected
   */
  protected _teleport: Element | null = null

  /**
   * 当前小部件的状态
   */
  get state(): RenderState {
    return this._state
  }

  /**
   * 当前作用域
   */
  get scope(): Scope {
    return this.widget['scope']
  }

  /**
   * 当前小部件的child虚拟节点元素
   *
   * @returns {ContainerElement | null}
   */
  get el(): ContainerElement | undefined {
    return this._child?.el
  }

  /**
   * 获取小部件自身的虚拟节点
   *
   * @returns {VNode}
   */
  get vnode(): VNode<WidgetType> {
    return this.widget['vnode']
  }

  /**
   * 获取小部件名称
   *
   * @returns {string}
   */
  get name(): string {
    return this.vnode.type.name || 'anonymous'
  }

  /**
   * 小部件实例
   *
   * @returns {Widget}
   */
  protected get widget(): T {
    return this._widget
  }

  /**
   * 判断节点是否需要传送
   *
   * 该属性需在渲染之后调用获取的结果才准确！！
   */
  get teleport(): null | Element {
    return this._teleport
  }

  /**
   * 渲染小部件，并返回渲染的真实元素
   *
   * 该方法仅触发 `beforeMount`生命周期，但不会触发`mounted`生命周期，需额外调用`mount`方法触发`mounted`生命周期。
   *
   * @param {ContainerElement} container - 容器元素，如果`beforeMount`钩子返回了指定的容器元素，则此参数无效。
   * @returns {ContainerElement} - 渲染的元素实例
   * @internal 核心方法，用于渲染小部件，并返回渲染的真实元素实例。
   */
  render(container?: ContainerElement): ContainerElement {
    if (this.state !== 'notRendered') {
      throw new Error('[Vitarx.WidgetRenderer.render]：组件已渲染，请勿重复渲染！')
    }

    let el: ContainerElement | null
    try {
      // 触发onBeforeMount生命周期
      const target = this.triggerLifeCycle(LifeCycleHooks.beforeMount)
      if (target instanceof Element) {
        // 如果指定了父元素，则不继续往下传递父元素，避免提前展示视图
        this._teleport = target
        // 将占位符节点插入到正常的父容器中
        container?.appendChild(this.shadowElement)
        el = renderElement(this.child) as ContainerElement
      } else {
        el = renderElement(this.child, container) as ContainerElement
      }
    } catch (e) {
      // 触发onError生命周期
      const errVNode = this.triggerLifeCycle(LifeCycleHooks.error, e, {
        source: 'render',
        instance: this.widget
      })
      // 如果渲染失败，则使用错误视图替换原视图
      this._child = isVNode(errVNode) ? errVNode : createVNode(Fragment)
      el = renderElement(this.child) as ContainerElement
    }
    this._state = 'notMounted'
    return el
  }

  /**
   * 挂载小部件
   *
   * 此方法负责触发组件的 `mounted` 和 `activated` 生命周期。
   *
   * 此方法通常是由框架内部逻辑调用，如果你是通过 `createWidgetRenderer` 助手函数的渲染器实现自定义的管控，
   * 那么你应该传入 `container` 参数，否则可能会组件挂载成功，但元素并未真实挂载到页面上。
   *
   * @param {ContainerElement} [container] - 容器HTML元素实例，如果`beforeMount`钩子返回了指定的容器元素，则此参数无效。
   * @returns {this} - 返回当前实例，方便链式调用。
   * @internal 核心方法，用于挂载小部件，未渲染会自动调用render方法。
   */
  mount(container?: ContainerElement): this {
    if (this.state === 'notRendered') {
      this.render(container)
    } else if (this.state !== 'notMounted') {
      throw new Error('[Vitarx.WidgetRenderer.mount]：组件非待挂载状态，不能进行挂载！')
    }
    // 递归挂载子节点
    mountVNode(this.child)
    // 挂载到传送节点上
    if (this.teleport) {
      this.teleport.appendChild(this.el!)
    }
    this._state = 'activated'
    // 触发onMounted生命周期
    this.triggerLifeCycle(LifeCycleHooks.mounted)
    // 触发onActivated生命周期
    this.triggerLifeCycle(LifeCycleHooks.activated)
    return this
  }

  /**
   * 卸载小部件
   *
   * @param {boolean} root - 用于递归时判断是否需要移除当前元素，内部逻辑使用，请勿外部传入。
   * @internal 核心方法
   */
  unmount(root: boolean = true): void {
    if (this.state !== 'uninstalling' && this.state !== 'unloaded') {
      this._state = 'uninstalling'
      const postUnmount = () => {
        // 销毁当前作用域
        this.scope?.destroy()
        // 移除占位元素
        this._shadowElement?.remove()
        // 修改状态为已卸载
        this._state = 'unloaded'
        // 触发onUnmounted生命周期
        this.triggerLifeCycle(LifeCycleHooks.unmounted)
      }
      // 触发onDeactivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.beforeUnmount)
      // 异步卸载标志
      let isAsyncUnmount = false
      // 如果是根节点且是激活状态，则需要触发删除元素前的回调
      if (root && this.state === 'activated') {
        const result = this.triggerLifeCycle(LifeCycleHooks.beforeRemove, this.el!, 'unmount')
        // 兼容异步卸载
        if (result instanceof Promise) {
          isAsyncUnmount = true
          // 异步卸载
          result.finally(() => {
            removeElement(this.el!)
            postUnmount()
          })
        }
      }
      // 递归卸载子节点
      unmountVNode(this.child, root && !isAsyncUnmount)
      // 如果不是异步卸载直接执行卸载逻辑
      if (!isAsyncUnmount) postUnmount()
    }
  }

  /**
   * 更新视图
   *
   * 更新视图不是同步的，会延迟更新，合并多个微任务。
   *
   * @param {VNode} newChildVNode - 新子节点，没有则使用`build`方法构建。
   * @return {void}
   * @internal 核心方法
   */
  update(newChildVNode?: VNode): void {
    if (newChildVNode && !isVNode(newChildVNode)) {
      throw new TypeError(`新的子节点必须是有效的VNode对象，给定：${typeof newChildVNode}`)
    }
    if (this.state === 'unloaded') {
      this.triggerLifeCycle(
        LifeCycleHooks.error,
        new Error('[Vitarx.WidgetRenderer.update]：组件已销毁，不能再更新视图！'),
        {
          source: 'update',
          instance: this.widget
        }
      )
    }
    // 如果状态是不活跃的，则不进行更新操作，会在下一次激活时执行更新操作
    if (this.state === 'deactivated') return
    // 如果是挂起的更新，则直接返回
    if (this._pendingUpdate) return
    this._pendingUpdate = true
    try {
      // 触发更新前生命周期
      this.triggerLifeCycle(LifeCycleHooks.beforeUpdate)
      // 使用 requestAnimationFrame 来延迟更新，合并多个微任务
      requestAnimationFrame(() => {
        this._pendingUpdate = false
        // 如果组件已卸载，则不进行更新
        if (this.state === 'unloaded' || !getElParentNode(this.el)) return
        const oldVNode = this._child
        const newVNode = newChildVNode || this.build()
        this._child = this.patchUpdate(oldVNode, newVNode)
        // 触发更新后生命周期
        this.triggerLifeCycle(LifeCycleHooks.updated)
      })
    } catch (e) {
      this._pendingUpdate = false
      throw e
    }
  }

  /**
   * 差异更新
   *
   * @param {VNode} oldVNode - 旧子节点
   * @param {VNode} newVNode - 新子节点
   * @protected
   */
  protected patchUpdate(oldVNode: VNode, newVNode: VNode): VNode {
    // 如果不是待挂载状态才进行自动挂载！修复由未挂载时更新操作导致子组件比父组件提前被挂载！
    return patchUpdate(oldVNode, newVNode, this.state !== 'notMounted')
  }

  /**
   * 让小部件恢复激活状态，重新挂载到父元素上。
   *
   * @param {boolean} root - 该参数用于递归时内部判断是否需要重新挂载，请勿外部传入。
   * @internal 核心方法
   */
  activate(root: boolean = true): void {
    if (this._state === 'deactivated') {
      this._state = 'activated'
      if (this.teleport) {
        // 复原传送节点元素
        this.teleport.appendChild(this.el!)
      } else if (root) {
        // 使用真实元素替换占位元素
        replaceElement(this.el!, this.shadowElement)
      }
      // 恢复作用域
      this.scope?.unpause()
      // 更新视图
      this.update()
      // 触发onActivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.activated)
      // 激活子节点
      updateActivateState(this.child, true)
    }
  }

  /**
   * 停用小部件
   *
   * @param root - 该参数用于递归时内部判断是否需要移除当前元素，请勿外部传入。
   * @internal 核心方法
   */
  deactivate(root: boolean = true): void {
    if (this._state !== 'activated') return
    this._state = 'deactivating'
    // 为非传送节点插入占位元素
    if (!this.teleport && root) {
      // 插入占位元素
      insertBeforeExactly(this.shadowElement, this.el!)
    }
    // 递归停用子节点
    updateActivateState(this.child, false)
    const post = () => {
      // 如果是根节点，则移除元素
      if (root) removeElement(this.el!)
      this.scope?.pause()
      this._state = 'deactivated'
      // 触发onDeactivated生命周期
      this.triggerLifeCycle(LifeCycleHooks.deactivated)
    }
    // 触发beforeRemove生命周期钩子，获取返回值
    const result = this.triggerLifeCycle(LifeCycleHooks.beforeRemove, this.el!, 'deactivate')
    if (result instanceof Promise) {
      result.finally(post)
    } else {
      post()
    }
  }

  /**
   * 构建`child`虚拟节点
   *
   * @internal 核心方法
   * @returns {VNode}
   */
  protected buildChild = (): VNode => {
    let vnode: VNode
    try {
      const buildNode = this.widget['build']()
      if (buildNode === null) {
        vnode = createVNode(Fragment)
      } else if (isVNode(buildNode)) {
        vnode = buildNode
      } else {
        throw new Error(`${this.name}.build 返回值必须是有效的VNode类型|NULL，否则无法渲染！`)
      }
    } catch (e) {
      const errVNode = this.triggerLifeCycle(LifeCycleHooks.error, e, {
        source: 'build',
        instance: this.widget
      })
      // 如果构建出错，则使用错误虚拟节点
      vnode = isVNode(errVNode) ? errVNode : createVNode(Fragment)
    }
    updateParentVNodeMapping(vnode, this.vnode)
    return vnode
  }

  /**
   * 构建虚拟DOM节点+依赖收集
   *
   * 每一次构建都会重新收集依赖，
   * 这样可以避免遗漏依赖造成视图不更新问题。
   *
   * @internal 核心方法
   * @protected
   */
  protected build(): VNode {
    this._viewDependListener.clear()
    this.scope.add(this._viewDependListener)
    const { deps, result } = Depend.collect(this.buildChild)
    if (deps.size > 0) {
      for (const [proxy, props] of deps) {
        for (const prop of props) {
          Observers.addListener(proxy, prop, this._viewDependListener, false)
        }
      }
    }
    return result
  }

  /**
   * 触发生命周期钩子
   *
   * @param hook - 生命周期钩子名称
   * @param args - 参数列表
   * @protected
   */
  protected triggerLifeCycle<K extends LifeCycleHooks>(
    hook: K,
    ...args: HookParameter<K>
  ): HookReturnType<K> {
    return _callLifeCycleHook(this.widget, hook, ...args)
  }
}

/**
 * 创建小部件渲染器
 *
 * 如果小部件存在必填参数，则需传入`props`参数。
 *
 * @param widget - 小部件构造函数
 * @returns {WidgetRenderer} - 小部件渲染器
 */
export function createWidgetRenderer(widget: WidgetType<{}>): WidgetRenderer<Widget<{}>>

/**
 * 创建小部件渲染器
 *
 * @param widget - 小部件构造函数
 * @param props - 小部件接收属性
 * @returns {WidgetRenderer} - 小部件渲染器
 */
export function createWidgetRenderer<P extends Record<string, any>>(
  widget: WidgetType<P>,
  props: P
): WidgetRenderer<Widget<P>>

/**
 * 创建小部件渲染器
 *
 * 通常用于一些需要在非组件树中渲染的场景，例如：模态框，消息提示框等。
 *
 * @example
 * ```js
 * // 此示例是将一个Modal组件挂载到body上
 * const renderer = createWidgetRenderer(Modal, {
 *   title: '标题',
 *   content: '内容',
 *   onConfirm: () => {
 *     console.log('确认')
 *   },
 *   onCancel: () => {
 *     console.log('取消')
 *   }
 * })
 * // 挂载到body
 * renderer.mount(document.body) // 如果Modal组件中通过 beforeMount 生命周期钩子返回了HTML元素实例则无需传入参数。
 * // 卸载组件
 * renderer.unmount()
 * ```
 *
 * @param {WidgetType} widget - 小部件构造函数
 * @param {Record<string, any>} props - 小部件接收属性
 * @returns {WidgetRenderer} - 小部件渲染器
 */
export function createWidgetRenderer(
  widget: WidgetType,
  props: Record<string, any> | null = null
): WidgetRenderer<Widget> {
  return createWidgetVNodeInstance(createVNode(widget, props))['renderer']
}
